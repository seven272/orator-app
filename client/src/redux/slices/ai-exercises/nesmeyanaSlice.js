import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'


// Старт упражнения с отправкой выбранного статического сценария
const fetchStartNesmeyana = createAsyncThunk(
  'nesmeyana/fetchStartNesmeyana',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-nesmeyana', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте тренажера Несмеяна'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудиозаписи анекдота на оцифровку
const fetchResponseNesmeyana = createAsyncThunk(
  'nesmeyana/fetchResponseNesmeyana',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      }

      const res = await axiosInstance.post(
        '/ai/response-nesmeyana',
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
        'Ошибка сервера в процессе оцифровки речи'
      return rejectWithValue(errorMsg)
    }
  },
)

// Получение развернутого фидбека ИИ по критериям юмора
const fetchFinishNesmeyana = createAsyncThunk(
  'nesmeyana/fetchFinishNesmeyana',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-nesmeyana', {
        isDaily,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при формировании комедийного фидбека'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС ТРЕНАЖЕРА
const nesmeyanaSlice = createSlice({
  name: 'nesmeyana',
  initialState: createBaseAiState(),
  reducers: {
    setNesmeyanaAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetNesmeyanaState: () => {
      return createBaseAiState()
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartNesmeyana.pending, setAiPending)
      .addCase(fetchStartNesmeyana.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
        ]
      })
      .addCase(fetchStartNesmeyana.rejected, setAiRejected)

      // --- ОЦИФРОВКА АНЕКДОТА ---
      .addCase(fetchResponseNesmeyana.pending, setAiPending)
      .addCase(fetchResponseNesmeyana.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { user_transcript, isFinished } = action.payload

        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        if (isFinished) {
          state.aiStatus = 'finished' // Активирует финишную кнопку в футере
        } else {
          state.aiStatus = 'idle' // Если пользователь промолчал, даем переписать
        }
      })
      .addCase(fetchResponseNesmeyana.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ФИНАЛИЗАЦИЯ И РЕЦЕНЗИЯ ---
      .addCase(fetchFinishNesmeyana.pending, setAiPending)
      .addCase(fetchFinishNesmeyana.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishNesmeyana.rejected, setAiRejected)
  },
})

export const { setNesmeyanaAiStatus, resetNesmeyanaState } =
  nesmeyanaSlice.actions
export {
  fetchStartNesmeyana,
  fetchResponseNesmeyana,
  fetchFinishNesmeyana,
}
export default nesmeyanaSlice.reducer
