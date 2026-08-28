import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartBargain = createAsyncThunk(
  'aiExercise/fetchStartBargain',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-bargain', {
        exerciseData,
      })

      console.log(res.data)

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Торг уместен'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseBargain = createAsyncThunk(
  'aiExercise/fetchResponseBargain',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем эталонный WAV для синхронного STT
      }
      const res = await axiosInstance.post(
        '/ai/response-bargain',
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
        'Ошибка сервера в процессе торга'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishBargain = createAsyncThunk(
  'aiExercise/fetchFinishBargain',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-bargain', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении торга'
      return rejectWithValue(errorMsg)
    }
  },
)

const bargainSlice = createSlice({
  name: 'bargain',
  // Расширяем базовый стейт текущей и целевой ценой для динамической шкалы скидки
  initialState: createBaseAiState({
    currentPrice: 0,
    targetPrice: 0,
  }),
  reducers: {
    setBargainAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetBargainState: () => {
      return createBaseAiState({ currentPrice: 0, targetPrice: 0 })
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartBargain.pending, setAiPending)
      .addCase(fetchStartBargain.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'idle' // Явно возвращаем в idle, чтобы активировать кнопку записи
        state.currentPrice = Number(action.payload.initialPrice) // Приведение к числу
        state.targetPrice = Number(action.payload.targetPrice) // Приведение к числу
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartBargain.rejected, setAiRejected)

      // Диалог (Торг)
      .addCase(fetchResponseBargain.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseBargain.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, currentPrice, user_transcript } =
          action.payload

        // Обновляем текущую стоимость товара на основе уступок ИИ-продавца
        state.currentPrice = currentPrice

        // Если была аудиозапись — вставляем распознанный текст перед ответом ИИ
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
      .addCase(fetchResponseBargain.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      // Финиш
      .addCase(fetchFinishBargain.pending, setAiPending)
      .addCase(fetchFinishBargain.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishBargain.rejected, setAiRejected)
  },
})

export const { setBargainAiStatus, resetBargainState } =
  bargainSlice.actions
export { fetchStartBargain, fetchResponseBargain, fetchFinishBargain }
export default bargainSlice.reducer
