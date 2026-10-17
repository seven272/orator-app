import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт питч-сессии
const fetchStartCommercialPitch = createAsyncThunk(
  'commercialPitch/fetchStartCommercialPitch',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/ai/start-commercial-pitch',
        {
          exerciseData,
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте питча с инвестором'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудиозаписи / реплики в диалоге
const fetchResponseCommercialPitch = createAsyncThunk(
  'commercialPitch/fetchResponseCommercialPitch',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // WAV-формат для синхронного STT
      }

      const res = await axiosInstance.post(
        '/ai/response-commercial-pitch',
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
        'Ошибка сервера в процессе защиты стартапа'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация питча и получение оценки
const fetchFinishCommercialPitch = createAsyncThunk(
  'commercialPitch/fetchFinishCommercialPitch',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/ai/finish-commercial-pitch',
        {
          isDaily,
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при формировании отчета инвестора'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС
const commercialPitchSlice = createSlice({
  name: 'commercialPitch',
  // Расширяем базовое состояние ИИ-тренажера шкалой интереса капиталиста (interest)
  initialState: createBaseAiState({ interest: 50 }),
  reducers: {
    setPitchAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetPitchState: () => {
      return createBaseAiState({ interest: 50 }) // Сброс возвращает интерес на базовые 50 очков
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartCommercialPitch.pending, setAiPending)
      .addCase(
        fetchStartCommercialPitch.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          state.interest = 50
          state.messages = [
            { role: 'assistant', text: action.payload.preview },
            { role: 'assistant', text: action.payload.question },
          ]
        },
      )
      .addCase(fetchStartCommercialPitch.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseCommercialPitch.pending, (state) => {
        setAiPending(state)
      })
      .addCase(
        fetchResponseCommercialPitch.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          const { answer, isFinished, interest, user_transcript } =
            action.payload

          state.interest = interest // Обновляем динамическую шкалу интереса Эдуарда

          // Если аудиозапись распознана — пушим текст игрока на экран
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
        },
      )
      .addCase(
        fetchResponseCommercialPitch.rejected,
        (state, action) => {
          state.exStatus = 'idle'
          // Безопасный откат: удаляем зависшую реплику пользователя при ошибке сети
          if (state.messages.at(-1)?.role === 'user') {
            state.messages.pop()
          }
          state.error = action.payload
        },
      )

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishCommercialPitch.pending, setAiPending)
      .addCase(
        fetchFinishCommercialPitch.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          state.aiStatus = 'finished'
          if (action.payload?.session?.result) {
            state.verdict = action.payload.session.result
          }
        },
      )
      .addCase(fetchFinishCommercialPitch.rejected, setAiRejected)
  },
})

export const { setPitchAiStatus, resetPitchState } =
  commercialPitchSlice.actions
export {
  fetchStartCommercialPitch,
  fetchResponseCommercialPitch,
  fetchFinishCommercialPitch,
}
export default commercialPitchSlice.reducer
