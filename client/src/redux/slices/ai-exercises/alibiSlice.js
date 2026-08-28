import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartAlibi = createAsyncThunk(
  'aiExercise/fetchStartAlibi',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-alibi', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Железного алиби'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseAlibi = createAsyncThunk(
  'aiExercise/fetchResponseAlibi',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем эталонный WAV для синхронного STT
      }
      const res = await axiosInstance.post(
        '/ai/response-alibi',
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
        'Ошибка сервера в процессе допроса'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishAlibi = createAsyncThunk(
  'aiExercise/fetchFinishAlibi',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-alibi', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении допроса'
      return rejectWithValue(errorMsg)
    }
  },
)

const alibiSlice = createSlice({
  name: 'alibi',
  // Расширяем базовый стейт шкалой доверия/правдоподобности (credibility)
  initialState: createBaseAiState({ credibility: 50 }),
  reducers: {
    setAlibiAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetAlibiState: () => {
      return createBaseAiState({ credibility: 50 }) // Сброс вернет доверие на базовую медиану
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartAlibi.pending, setAiPending)
      .addCase(fetchStartAlibi.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.credibility = 50
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
          { role: 'assistant', text: action.payload.question },
        ]
      })
      .addCase(fetchStartAlibi.rejected, setAiRejected)

      // Диалог
      .addCase(fetchResponseAlibi.pending, (state) => {
        setAiPending(state)
      })
      .addCase(fetchResponseAlibi.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, credibility, user_transcript } =
          action.payload

        state.credibility = credibility // Обновляем динамическую шкалу доверия ИИ к алиби

        // Если была аудиозапись — вставляем распознанный текст перед репликой ИИ
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
      .addCase(fetchResponseAlibi.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      // Финиш
      .addCase(fetchFinishAlibi.pending, setAiPending)
      .addCase(fetchFinishAlibi.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishAlibi.rejected, setAiRejected)
  },
})

export const { setAlibiAiStatus, resetAlibiState } =
  alibiSlice.actions
export { fetchStartAlibi, fetchResponseAlibi, fetchFinishAlibi }
export default alibiSlice.reducer
