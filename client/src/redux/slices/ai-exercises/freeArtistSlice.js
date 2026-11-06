import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт упражнения с передачей кастомной темы монолога
export const fetchStartFreeArtist = createAsyncThunk(
  'freeArtist/fetchStartFreeArtist',
  async (customTopic, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-free-artist', {
        customTopic,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте симулятора'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудиозаписи монолога на оцифровку
export const fetchResponseFreeArtist = createAsyncThunk(
  'freeArtist/fetchResponseFreeArtist',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      }

      const res = await axiosInstance.post(
        '/ai/response-free-artist',
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
        'Ошибка сервера в процессе оцифровки монолога'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и получение развернутой ИИ-рецензии
export const fetchFinishFreeArtist = createAsyncThunk(
  'freeArtist/fetchFinishFreeArtist',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-free-artist', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при генерации рецензии ИИ'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС ТРЕНАЖЕРА
const freeArtistSlice = createSlice({
  name: 'freeArtist',
  initialState: createBaseAiState(), // Чистый стейт без побочных банкетных параметров
  reducers: {
    setFreeArtistAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetFreeArtistState: () => {
      return createBaseAiState()
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartFreeArtist.pending, setAiPending)
      .addCase(fetchStartFreeArtist.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
        ]
      })
      .addCase(fetchStartFreeArtist.rejected, setAiRejected)

      // --- ОЦИФРОВКА РЕЧИ ---
      .addCase(fetchResponseFreeArtist.pending, setAiPending)
      .addCase(fetchResponseFreeArtist.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { user_transcript, isFinished } = action.payload

        // Пушим распознанный текст монолога оратора в историю чата
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        // Переводим статус в finished для активации кнопки "Получить рецензию"
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle' // На случай, если пользователь промолчал
        }
      })
      .addCase(fetchResponseFreeArtist.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ И РЕЦЕНЗИЯ ---
      .addCase(fetchFinishFreeArtist.pending, setAiPending)
      .addCase(fetchFinishFreeArtist.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishFreeArtist.rejected, setAiRejected)
  },
})

export const { setFreeArtistAiStatus, resetFreeArtistState } =
  freeArtistSlice.actions
export default freeArtistSlice.reducer
