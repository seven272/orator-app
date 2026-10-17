import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// ==========================================
// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)
// ==========================================

// Старт дикционной сессии
const fetchStartRhythmTransformer = createAsyncThunk(
  'rhythmTransformer/fetchStartRhythmTransformer',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-rhythm-transformer', {
        exerciseData,
      })
      // Нам также нужны стартовые данные скороговорки на клиенте
      return { ...res.data, initialText: exerciseData.round_1 }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте ИИ-Метронома'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудиозаписи текущего раунда скороговорки
const fetchResponseRhythmTransformer = createAsyncThunk(
  'rhythmTransformer/fetchResponseRhythmTransformer',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      }

      const res = await axiosInstance.post(
        '/ai/response-rhythm-transformer',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при обработке дикционного раунда'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и запрос ИИ-аудита у логопеда
const fetchFinishRhythmTransformer = createAsyncThunk(
  'rhythmTransformer/fetchFinishRhythmTransformer',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-rhythm-transformer', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при получении логопедического вердикта'
      return rejectWithValue(errorMsg)
    }
  },
)

// ==========================================
// 2. СЛАЙС И РЕДЬЮСЕРЫ
// ==========================================
const rhythmTransformerSlice = createSlice({
  name: 'rhythmTransformer',
  // Расширяем базовое состояние ИИ-тренажера шкалой артикуляции и полем для текущего текста чтения
  initialState: createBaseAiState({ articulation: 100, currentText: '' }),
  reducers: {
    setTransformerAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetTransformerState: () => {
      return createBaseAiState({ articulation: 100, currentText: '' })
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartRhythmTransformer.pending, setAiPending)
      .addCase(fetchStartRhythmTransformer.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.articulation = 100
        // Напрямую берем round_1 из переданных в экшен входных данных exerciseData
        state.currentText = action.meta.arg.round_1 
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
        ]
      })
      .addCase(fetchStartRhythmTransformer.rejected, setAiRejected)

      // --- ХОД ДИАЛОГА (ПЕРЕКЛЮЧЕНИЕ ТЕКСТОВ) ---
      .addCase(fetchResponseRhythmTransformer.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseRhythmTransformer.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, articulation, user_transcript } = action.payload

        state.articulation = articulation // Обновляем шкалу дикции

        // Особая логика: пушим в историю то, что распознано (для логов),
        // но НЕ выводим баблы ИИ-ответов. Вместо этого меняем текст на экране!
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.currentText = answer // ПОДМЕНА: Выводим усложненный текст для следующего раунда!
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseRhythmTransformer.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishRhythmTransformer.pending, setAiPending)
      .addCase(fetchFinishRhythmTransformer.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishRhythmTransformer.rejected, setAiRejected)
  },
})

export const { setTransformerAiStatus, resetTransformerState } = rhythmTransformerSlice.actions
export { fetchStartRhythmTransformer, fetchResponseRhythmTransformer, fetchFinishRhythmTransformer }
export default rhythmTransformerSlice.reducer
