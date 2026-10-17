import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт упражнения
const fetchStartToastCritic = createAsyncThunk(
  'toastCritic/fetchStartToastCritic',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-toast-critic', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Банкетного критика'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудиозаписи праздничного тоста
const fetchResponseToastCritic = createAsyncThunk(
  'toastCritic/fetchResponseToastCritic',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      }

      const res = await axiosInstance.post(
        '/ai/response-toast-critic',
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
        'Ошибка сервера в процессе оценки тоста'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация сессии и получение вердикта
const fetchFinishToastCritic = createAsyncThunk(
  'toastCritic/fetchFinishToastCritic',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/ai/finish-toast-critic',
        {
          isDaily,
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при получении вердикта тамады'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС ТРЕНАЖЕРА
const toastCriticSlice = createSlice({
  name: 'toastCritic',
  // Расширяем базовое состояние ИИ-тренажера шкалой эмоционального отклика зала
  initialState: createBaseAiState({ emotionalResponse: 50 }),
  reducers: {
    setToastCriticAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetToastCriticState: () => {
      return createBaseAiState({ emotionalResponse: 50 })
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartToastCritic.pending, setAiPending)
      .addCase(fetchStartToastCritic.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.emotionalResponse = 50
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartToastCritic.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseToastCritic.pending, (state) => {
        setAiPending(state)
      })
      .addCase(
        fetchResponseToastCritic.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          const {
            answer,
            isFinished,
            emotionalResponse,
            user_transcript,
          } = action.payload

          state.emotionalResponse = emotionalResponse // Обновляем прогресс-бар отклика зала

          // 1. Сначала пушим распознанный текст пользователя, если он есть
          if (user_transcript) {
            state.messages.push({
              role: 'user',
              text: user_transcript,
            })
          }

          // 2. ИСПРАВЛЕНО: Мы ВСЕГДА пушим ответ ИИ в чат, чтобы пользователь его прочитал
          if (answer) {
            state.messages.push({
              role: 'assistant',
              text: answer,
            })
          }

          // 3. Переключаем статус UI нижней панели
          if (isFinished) {
            state.aiStatus = 'finished' // Активирует появление кнопки "Выслушать вердикт" в футере
          } else {
            state.aiStatus = 'idle'
          }
        },
      )
      .addCase(fetchResponseToastCritic.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishToastCritic.pending, setAiPending)
      .addCase(fetchFinishToastCritic.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishToastCritic.rejected, setAiRejected)
  },
})

export const { setToastCriticAiStatus, resetToastCriticState } =
  toastCriticSlice.actions
export {
  fetchStartToastCritic,
  fetchResponseToastCritic,
  fetchFinishToastCritic,
}
export default toastCriticSlice.reducer
