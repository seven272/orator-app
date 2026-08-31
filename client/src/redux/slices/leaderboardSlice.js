import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

const fetchLeaderboard = createAsyncThunk(
  'leaderboard/fetch',
  async (type = 'global', { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(`/leaderboard/get?type=${type}`)
      // Возвращаем вместе с типом, чтобы редьюсер знал, куда положить данные
      return { data: res.data, type }
    } catch (err) {
      return rejectWithValue(err.response?.data || 'Ошибка сервера')
    }
  }
)

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: {
    weeklyList: [],        // 📑 ТОП-10 за неделю
    globalList: [],        // 📑 ТОП-10 за всё время
    weeklyCurrentUser: null, // 👤 Юзер за неделю
    globalCurrentUser: null, // 👤 Юзер за всё время
    status: 'idle',    
    error: null,
  },
  reducers: {
    resetLeaderboardState: (state) => {
      state.weeklyList = []
      state.globalList = []
      state.weeklyCurrentUser = null
      state.globalCurrentUser = null
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
        const { data, type } = action.payload

        // Распределяем данные в зависимости от того, какой тип запросили
        if (type === 'weekly') {
          state.weeklyList = data.leaderboard
          state.weeklyCurrentUser = data.currentUser
        } else {
          state.globalList = data.leaderboard
          state.globalCurrentUser = data.currentUser
        }
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetLeaderboardState } = leaderboardSlice.actions
export { fetchLeaderboard }
export default leaderboardSlice.reducer
