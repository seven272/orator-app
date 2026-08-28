import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

// 1. Асинхронный thunk для получения списка челленджей
const fetchChallenges = createAsyncThunk(
  'challenges/fetchChallenges',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/challenges/all')
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Ошибка загрузки челленджей',
      )
    }
  },
)

// 2. Асинхронный thunk для отправки текстового отчета
const fetchSubmitChallengeReport = createAsyncThunk(
  'challenges/fetchSubmitChallengeReport',
  async ({ challengeId, textReport }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/challenges/submit-report',
        {
          challengeId,
          textReport,
        },
      )
      return { challengeId, data: res.data } // возвращаем ID челленджа и новые данные юзера с бэка
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Ошибка отправки отчета',
      )
    }
  },
)

const challengeSlice = createSlice({
  name: 'challenge',
  initialState: {
    list: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    submitStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    resetChallengesState: (state) => {
      state.list = []
      state.status = 'idle'
      state.submitStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Обработка получения списка
      .addCase(fetchChallenges.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchChallenges.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload
      })
      .addCase(fetchChallenges.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      // Обработка отправки отчета
      .addCase(fetchSubmitChallengeReport.pending, (state) => {
        state.submitStatus = 'loading'
      })
      .addCase(
        fetchSubmitChallengeReport.fulfilled,
        (state, action) => {
          state.submitStatus = 'succeeded'
          // Мгновенно обновляем статус конкретного челленджа в массиве list на 'completed'
          const currentChallenge = state.list.find(
            (ch) => ch.id === action.payload.challengeId,
          )
          if (currentChallenge) {
            currentChallenge.status = 'completed'
          }
        },
      )
      .addCase(fetchSubmitChallengeReport.rejected, (state) => {
        state.submitStatus = 'failed'
      })
  },
})

export const { resetChallengesState } = challengeSlice.actions
export { fetchSubmitChallengeReport, fetchChallenges }
export default challengeSlice.reducer
