import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. Старт упражнения на сцене
const fetchStartKnockout = createAsyncThunk(
  'aiExercise/fetchStartKnockout',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-knockout', {
        exerciseData,
      })

      console.log(res.data)

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Остроумный нокаут'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. Диалог с токсичным хеклером / комиком
const fetchResponseKnockout = createAsyncThunk(
  'aiExercise/fetchResponseKnockout',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Синхронный STT для вашей шутки
      }
      const res = await axiosInstance.post(
        '/ai/response-knockout',
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
        'Ошибка сервера в процессе комедийной дуэли'
      return rejectWithValue(errorMsg)
    }
  },
)

// 3. Финализация стендап-сессии и получение оценок жюри
const fetchFinishKnockout = createAsyncThunk(
  'aiExercise/fetchFinishKnockout',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-knockout', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении стендап-выступления'
      return rejectWithValue(errorMsg)
    }
  },
)

const knockoutSlice = createSlice({
  name: 'knockout',
  // Расширяем базовый стейт шкалой репутации (одобрения) зрительного зала от 0 до 100
  initialState: createBaseAiState({ audienceReputation: 50 }),
  reducers: {
    setKnockoutAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetKnockoutState: () => {
      return createBaseAiState({ audienceReputation: 50 }) // Сброс вернет репутацию на 50 баллов
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartKnockout.pending, setAiPending)
      .addCase(fetchStartKnockout.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'idle'
        state.audienceReputation = 50 // Стартуем с нейтральной репутации
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question }, // Первый токсичный подкол от ИИ
        ]
      })
      .addCase(fetchStartKnockout.rejected, setAiRejected)

      // Диалог (Парирование)
      .addCase(fetchResponseKnockout.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseKnockout.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const {
          answer,
          isFinished,
          audienceReputation,
          user_transcript,
        } = action.payload

        // Обновляем шкалу одобрения зала в зависимости от качества панча пользователя
        state.audienceReputation = Number(audienceReputation) || 50

        // Если была аудиозапись — вставляем распознанный текст шутки перед ответом ИИ
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.messages.push({
            role: 'assistant',
            text: answer,
          })
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseKnockout.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      // Финиш (Вердикт)
      .addCase(fetchFinishKnockout.pending, setAiPending)
      .addCase(fetchFinishKnockout.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishKnockout.rejected, setAiRejected)
  },
})

export const { setKnockoutAiStatus, resetKnockoutState } =
  knockoutSlice.actions
export {
  fetchStartKnockout,
  fetchResponseKnockout,
  fetchFinishKnockout,
}
export default knockoutSlice.reducer
