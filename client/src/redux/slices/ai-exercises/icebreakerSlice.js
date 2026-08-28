import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartIcebreaker = createAsyncThunk(
  'aiExercise/fetchStartIcebreaker',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-icebreaker', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Ледакола'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseIcebreaker = createAsyncThunk(
  'aiExercise/fetchResponseIcebreaker',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем эталонный WAV для синхронного STT
      }
      const res = await axiosInstance.post(
        '/ai/response-icebreaker',
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
        'Ошибка сервера при проведении интервью'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishIcebreaker = createAsyncThunk(
  'aiExercise/fetchFinishIcebreaker',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-icebreaker', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении Ледокола'
      return rejectWithValue(errorMsg)
    }
  },
)

const icebreakerSlice = createSlice({
  name: 'icebreaker',
  initialState: createBaseAiState({ warmth: 0 }), // Расширяем базовый стейт шкалой тепла!
  reducers: {
    setIcebreakerAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetIcebreakerState: () => {
      return createBaseAiState({ warmth: 0 }) // Сброс вернет warmth в 0
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartIcebreaker.pending, setAiPending)
      .addCase(fetchStartIcebreaker.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.warmth = 0
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartIcebreaker.rejected, setAiRejected)

      // Диалог
      .addCase(fetchResponseIcebreaker.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseIcebreaker.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, warmth, user_transcript } =
          action.payload

        state.warmth = warmth // Обновляем динамическую шкалу тепла

        // Если была аудиозапись — вставляем распознанный Сбером текст перед репликой ИИ
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
      .addCase(fetchResponseIcebreaker.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })
 
      // Финиш
      .addCase(fetchFinishIcebreaker.pending, setAiPending)
      .addCase(fetchFinishIcebreaker.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishIcebreaker.rejected, setAiRejected)
  },
})

export const { setIcebreakerAiStatus, resetIcebreakerState } =
  icebreakerSlice.actions
export {
  fetchStartIcebreaker,
  fetchResponseIcebreaker,
  fetchFinishIcebreaker,
}
export default icebreakerSlice.reducer
