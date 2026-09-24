import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { fetchCompleteExercise } from './exerciseSlice'

// Асинхронный запрос для получения заданий дня
const fetchDailyTasks = createAsyncThunk(
  'daily/fetchDailyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/daily-tasks/get')
      // 🎯 Бэкенд возвращает { date, tasks, isGuest }
      return {
        tasks: res.data.tasks,
        date: res.data.date,
        isDemo: res.data.isGuest, // Напрямую связываем isDemo с флагом из БД
      }
    } catch (err) {
      // Сюда мы попадаем только при реальном падении сервера или отсутствии сети
      return rejectWithValue(err.response?.data || 'Ошибка загрузки')
    }
  },
)

// экшен открытия сундука
const fetchClaimSuperPrize = createAsyncThunk(
  'daily/fetchClaimSuperPrize',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/daily-tasks/claim-superprize',
      )
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Не удалось открыть сундук',
      )
    }
  },
)

const dailySlice = createSlice({
  name: 'daily',
  initialState: {
    tasks: [],
    date: null,
    isDemo: false, // Флаг, чтобы компоненты знали, авторизован ли юзер
    status: 'idle',
    error: null,
    prizeLoading: false, // Флаг процесса открытия сундука на бэкенде
    prizeError: null, // Текст ошибки при попытке забрать недельный суперприз
    claimedPrizeData: null, // Объект с данными выигранного приза (тип, название, код) для модалки
  },
  reducers: {
    updateTaskProgress: (state, action) => {
      const { alias, isCompleted, currentValue } = action.payload
      const task = state.tasks.find((t) => t.alias === alias)
      if (task) {
        task.isCompleted = isCompleted
        task.currentValue = currentValue
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompleteExercise.fulfilled, (state, action) => {
        const update = action.payload.daily_task_update
        if (update) {
          const task = state.tasks.find(
            (t) => t.alias === update.alias,
          )
          if (task) {
            task.isCompleted = update.isCompleted
            task.currentValue = update.currentValue
          }
        }
      })
      .addCase(fetchDailyTasks.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchDailyTasks.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.tasks = action.payload.tasks
        state.date = action.payload.date
        state.isDemo = action.payload.isDemo
      })
      .addCase(fetchDailyTasks.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      //получение награды за 7 дней стрика
      .addCase(fetchClaimSuperPrize.pending, (state) => {
        state.prizeLoading = true
        state.prizeError = null
      })
      .addCase(fetchClaimSuperPrize.fulfilled, (state, action) => {
        state.prizeLoading = false
        // Приз успешно получен, фронтенд покажет красивое окно с подарком action.payload.prize
        state.claimedPrizeData = action.payload.prize
      })
      .addCase(fetchClaimSuperPrize.rejected, (state, action) => {
        state.prizeLoading = false
        state.prizeError = action.payload
      })
  },
})

export const { updateTaskProgress } = dailySlice.actions
export { fetchDailyTasks, fetchClaimSuperPrize }
export default dailySlice.reducer
