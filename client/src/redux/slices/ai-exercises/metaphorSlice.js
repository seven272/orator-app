import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. Старт упражнения (выбор персонажа и термина)
const fetchStartMetaphor = createAsyncThunk(
  'aiExercise/fetchStartMetaphor',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-metaphor', {
        exerciseData,
      })

      console.log(res.data)

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Трудный переводчик'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. Диалог (отправка аудио-объяснения)
const fetchResponseMetaphor = createAsyncThunk(
  'aiExercise/fetchResponseMetaphor',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Синхронный STT для метафоры пользователя
      }
      const res = await axiosInstance.post(
        '/ai/response-metaphor',
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
        'Ошибка сервера в процессе объяснения термина'
      return rejectWithValue(errorMsg)
    }
  },
)

// 3. Завершение сессии и оценка гибкости мышления
const fetchFinishMetaphor = createAsyncThunk(
  'aiExercise/fetchFinishMetaphor',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-metaphor', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении упражнения Трудный переводчик'
      return rejectWithValue(errorMsg)
    }
  },
)

const metaphorSlice = createSlice({
  name: 'metaphor',
  // Расширяем базовый стейт шкалой понимания ИИ от 0 до 100
  initialState: createBaseAiState({ understanding: 0 }),
  reducers: {
    setMetaphorAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetMetaphorState: () => {
      return createBaseAiState({ understanding: 0 }) // Сброс возвращает понимание на 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartMetaphor.pending, setAiPending)
      .addCase(fetchStartMetaphor.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'idle'
        state.understanding = 0 // Изначально ИИ ничего не понимает
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question }, // Первая недоумевающая фраза персонажа
        ]
      })
      .addCase(fetchStartMetaphor.rejected, setAiRejected)

      // Диалог
      .addCase(fetchResponseMetaphor.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseMetaphor.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, understanding, user_transcript } =
          action.payload

        // Обновляем шкалу понимания на основе простоты и точности метафоры пользователя
        state.understanding = Number(understanding) || 0

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
      .addCase(fetchResponseMetaphor.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      // Финиш
      .addCase(fetchFinishMetaphor.pending, setAiPending)
      .addCase(fetchFinishMetaphor.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishMetaphor.rejected, setAiRejected)
  },
})

export const { setMetaphorAiStatus, resetMetaphorState } =
  metaphorSlice.actions
export {
  fetchStartMetaphor,
  fetchResponseMetaphor,
  fetchFinishMetaphor,
}
export default metaphorSlice.reducer
