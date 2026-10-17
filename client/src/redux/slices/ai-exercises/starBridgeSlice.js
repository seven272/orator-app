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

// Старт сессии нетворкинга в лифте
const fetchStartStarBridge = createAsyncThunk(
  'starBridge/fetchStartStarBridge',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-star-bridge', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Мост к кумиру'
      return rejectWithValue(errorMsg)
    }
  },
)

// Игровой шаг (отправка короткой реплики питча)
const fetchResponseStarBridge = createAsyncThunk(
  'starBridge/fetchResponseStarBridge',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем WAV-файл для STT
      }

      const res = await axiosInstance.post(
        '/ai/response-star-bridge',
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
        'Ошибка сервера в процессе скоростного питча'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и вердикт эксперта по нетворкингу
const fetchFinishStarBridge = createAsyncThunk(
  'starBridge/fetchFinishStarBridge',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-star-bridge', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при вынесении вердикта по питчу'
      return rejectWithValue(errorMsg)
    }
  },
)

// ==========================================
// 2. СЛАЙС И РЕДЬЮСЕРЫ
// ==========================================
const starBridgeSlice = createSlice({
  name: 'starBridge',
  // Инициализируем базовое состояние ИИ-тренажера, добавляя шкалу внимания кумира
  initialState: createBaseAiState({ attention: 20 }),
  reducers: {
    setStarAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetStarState: () => {
      return createBaseAiState({ attention: 20 }) // Сброс возвращает внимание на стартовые 20%
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartStarBridge.pending, setAiPending)
      .addCase(fetchStartStarBridge.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.attention = 20
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartStarBridge.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseStarBridge.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseStarBridge.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, attention, user_transcript } =
          action.payload

        state.attention = attention // Обновляем динамическую шкалу внимания селебрити

        // Если речь успешно распознана — пушаем короткий оффер оратора в чат
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
      .addCase(fetchResponseStarBridge.rejected, (state, action) => {
        state.exStatus = 'idle'
        // Безопасный откат: удаляем последнюю реплику пользователя, если сервер вернул ошибку
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishStarBridge.pending, setAiPending)
      .addCase(fetchFinishStarBridge.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishStarBridge.rejected, setAiRejected)
  },
})

export const { setStarAiStatus, resetStarState } = starBridgeSlice.actions
export { fetchStartStarBridge, fetchResponseStarBridge, fetchFinishStarBridge }
export default starBridgeSlice.reducer
