import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (type = 'global', { rejectWithValue }) => {
    try {
      // Передаем тип рейтинга в query-параметры: /leaderboard?type=weekly
      const res = await axiosInstance.get(`/leaderboard/get?type=${type}`)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Ошибка сервера')
    }
  }
)

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    list: [],          // Список ТОП-10 пользователей
    currentUser: null, // Статистика и место текущего юзера
    status: 'idle',    // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Редьюсер для очистки состояния при размонтировании экрана (опционально)
    resetLeaderboardState: (state) => {
      state.list = []
      state.currentUser = null
      state.status = 'idle'
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.status = 'loading'
        state.error = null 
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.list = action.payload.leaderboard
        state.currentUser = action.payload.currentUser
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetLeaderboardState } = leaderboardSlice.actions
export {fetchLeaderboard}
export default leaderboardSlice.reducer