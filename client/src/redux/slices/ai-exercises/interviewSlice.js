import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartInterview = createAsyncThunk(
  'aiExercise/fetchStartInerview',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-interview', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте дебатов'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseInterview = createAsyncThunk(
  'aiExercise/fetchResponseInterview',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем эталонный WAV для синхронного STT
      }

      const res = await axiosInstance.post(
        '/ai/response-interview',
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

const fetchFinishInterview = createAsyncThunk(
  'aiExercise/fetchFinishInterview',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-interview', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении интервью'
      return rejectWithValue(errorMsg)
    }
  },
)

// --- ИНТЕРВЬЮ СЛАЙС ---
const interviewSlice = createSlice({
  name: 'interview',
  initialState: createBaseAiState(), // Используем фабрику базового стейта
  reducers: {
    setInterviewAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Стрелочная функция без аргументов для мгновенного и чистого сброса
    resetInterviewState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // *Старт интервью*
      .addCase(fetchStartInterview.pending, setAiPending)
      .addCase(fetchStartInterview.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartInterview.rejected, setAiRejected)

      // *Ответ пользователя*
      .addCase(fetchResponseInterview.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseInterview.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isInterviewFinished, user_transcript } =
          action.payload

        // Вытаскиваем расшифрованный Сбером текст и красиво вставляем перед репликой ИИ
        if (user_transcript) {
          state.messages.push({ role: 'user', text: user_transcript })
        }

        if (isInterviewFinished === true) {
          state.aiStatus = 'finished'
        } else {
          state.messages.push({ role: 'assistant', text: answer })
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseInterview.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop() // Откатываем UI-сообщение пользователя при сбое сети
        }
        state.error = action.payload
      })

      // *Оценка ИИ-судьи*
      .addCase(fetchFinishInterview.pending, setAiPending)
      .addCase(fetchFinishInterview.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      }) 
      .addCase(fetchFinishInterview.rejected, setAiRejected)
  },
})

export const { setInterviewAiStatus, resetInterviewState } =
  interviewSlice.actions
export {
  fetchStartInterview,
  fetchResponseInterview,
  fetchFinishInterview,
}
export default interviewSlice.reducer
