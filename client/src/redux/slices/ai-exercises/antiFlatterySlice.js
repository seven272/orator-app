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

// Старт переговорной сессии
const fetchStartAntiFlattery = createAsyncThunk(
  'antiFlattery/fetchStartAntiFlattery',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-anti-flattery', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Анти-Лесть'
      return rejectWithValue(errorMsg)
    }
  },
)

// Игровой диалог (отправка ответа на манипуляцию)
const fetchResponseAntiFlattery = createAsyncThunk(
  'antiFlattery/fetchResponseAntiFlattery',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем WAV-файл для STT
      }

      const res = await axiosInstance.post(
        '/ai/response-anti-flattery',
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
        'Ошибка сервера в процессе переговоров'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и вердикт ИИ-эксперта
const fetchFinishAntiFlattery = createAsyncThunk(
  'antiFlattery/fetchFinishAntiFlattery',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-anti-flattery', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при вынесении вердикта переговорщика'
      return rejectWithValue(errorMsg)
    }
  },
)

// ==========================================
// 2. СЛАЙС И РЕДЬЮСЕРЫ
// ==========================================
const antiFlatterySlice = createSlice({
  name: 'antiFlattery',
  // Инициализируем базовое состояние ИИ-тренажера, добавляя шкалу защиты границ
  initialState: createBaseAiState({ borders: 100 }),
  reducers: {
    setFlatteryAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetFlatteryState: () => {
      return createBaseAiState({ borders: 100 }) // Сброс возвращает прочность границ на максимум (100)
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartAntiFlattery.pending, setAiPending)
      .addCase(fetchStartAntiFlattery.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.borders = 100
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartAntiFlattery.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseAntiFlattery.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseAntiFlattery.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, borders, user_transcript } =
          action.payload

        state.borders = borders // Синхронизируем текущую прочность границ

        // Если речь успешно распознана — пушаем реплику игрока в историю чата
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
      .addCase(fetchResponseAntiFlattery.rejected, (state, action) => {
        state.exStatus = 'idle'
        // Безопасный откат: удаляем последнее сообщение пользователя, если сервер ответил ошибкой
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishAntiFlattery.pending, setAiPending)
      .addCase(fetchFinishAntiFlattery.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishAntiFlattery.rejected, setAiRejected)
  },
})

export const { setFlatteryAiStatus, resetFlatteryState } = antiFlatterySlice.actions
export { fetchStartAntiFlattery, fetchResponseAntiFlattery, fetchFinishAntiFlattery }
export default antiFlatterySlice.reducer
