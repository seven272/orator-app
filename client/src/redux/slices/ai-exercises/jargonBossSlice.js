import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт упражнения
const fetchStartJargonBoss = createAsyncThunk(
  'jargonBoss/fetchStartJargonBoss',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-jargon-boss', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Разрули Тёрки'
      return rejectWithValue(errorMsg)
    }
  },
)

// Игровой диалог (отправка аудио/реплики)
const fetchResponseJargonBoss = createAsyncThunk(
  'jargonBoss/fetchResponseJargonBoss',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // WAV-файл для синхронного STT
      }

      const res = await axiosInstance.post(
        '/ai/response-jargon-boss',
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
        'Ошибка сервера в процессе разборки'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и оценка
const fetchFinishJargonBoss = createAsyncThunk(
  'jargonBoss/fetchFinishJargonBoss',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-jargon-boss', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при вынесении вердикта'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС
const jargonBossSlice = createSlice({
  name: 'jargonBoss',
  // Инициализируем базовое состояние ИИ-тренажера, добавляя шкалу репутации/авторитета
  initialState: createBaseAiState({ reputation: 50 }),
  reducers: {
    setJargonAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetJargonState: () => {
      return createBaseAiState({ reputation: 50 }) // Сброс возвращает авторитет на медиану
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartJargonBoss.pending, setAiPending)
      .addCase(fetchStartJargonBoss.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.reputation = 50
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartJargonBoss.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseJargonBoss.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseJargonBoss.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, reputation, user_transcript } =
          action.payload

        state.reputation = reputation // Обновляем динамическую шкалу авторитета

        // Если речь распознана — пушим реплику игрока в чат
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
      .addCase(fetchResponseJargonBoss.rejected, (state, action) => {
        state.exStatus = 'idle'
        // Безопасный откат: если последнее сообщение зависло, чистим стейт
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishJargonBoss.pending, setAiPending)
      .addCase(fetchFinishJargonBoss.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishJargonBoss.rejected, setAiRejected)
  },
})

export const { setJargonAiStatus, resetJargonState } = jargonBossSlice.actions
export { fetchStartJargonBoss, fetchResponseJargonBoss, fetchFinishJargonBoss }
export default jargonBossSlice.reducer
