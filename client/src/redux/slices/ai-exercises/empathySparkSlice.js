import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт сессии эмпатии
const fetchStartEmpathySpark = createAsyncThunk(
  'empathySpark/fetchStartEmpathySpark',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-empathy-spark', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Генератора Эмпатии'
      return rejectWithValue(errorMsg)
    }
  },
)

// Игровой диалог (отправка ответа поддержки)
const fetchResponseEmpathySpark = createAsyncThunk(
  'empathySpark/fetchResponseEmpathySpark',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем WAV-файл для STT
      }

      const res = await axiosInstance.post(
        '/ai/response-empathy-spark',
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
        'Ошибка сервера в процессе психологической беседы'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и вердикт психолога
const fetchFinishEmpathySpark = createAsyncThunk(
  'empathySpark/fetchFinishEmpathySpark',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-empathy-spark', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при получении вердикта психолога'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС
const empathySparkSlice = createSlice({
  name: 'empathySpark',
  // Инициализируем базовое состояние ИИ-тренажера, добавляя шкалу эмоционального баланса
  initialState: createBaseAiState({ empathyBalance: 40 }),
  reducers: {
    setEmpathyAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetEmpathyState: () => {
      return createBaseAiState({ empathyBalance: 40 }) // Сброс возвращает баланс на стартовые 40 очков
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartEmpathySpark.pending, setAiPending)
      .addCase(fetchStartEmpathySpark.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.empathyBalance = 40
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartEmpathySpark.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseEmpathySpark.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseEmpathySpark.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, empathyBalance, user_transcript } =
          action.payload

        state.empathyBalance = empathyBalance // Обновляем динамическую шкалу доверия собеседника

        // Если речь распознана — пушаем реплику игрока в чат поддержки
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
      .addCase(fetchResponseEmpathySpark.rejected, (state, action) => {
        state.exStatus = 'idle'
        // Безопасный откат зависшего сообщения пользователя
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishEmpathySpark.pending, setAiPending)
      .addCase(fetchFinishEmpathySpark.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishEmpathySpark.rejected, setAiRejected)
  },
})

export const { setEmpathyAiStatus, resetEmpathyState } = empathySparkSlice.actions
export { fetchStartEmpathySpark, fetchResponseEmpathySpark, fetchFinishEmpathySpark }
export default empathySparkSlice.reducer
