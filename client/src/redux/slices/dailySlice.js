import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { fetchCompleteExercise } from './exerciseSlice'
import { All_EXERCISES } from '../../assets/mocks/exercises' 

// Асинхронный запрос для получения заданий дня
const fetchDailyTasks = createAsyncThunk(
  'daily/fetchDailyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/daily-tasks/get')
      return { tasks: res.data.tasks, date: res.data.date, isDemo: false }
    } catch (err) {
      // 🎲 Бэкенд ответил ошибкой (гость). Формируем разноуровневое превью:
      const demoTasks = []

      // 1. Берем первое упражнение из 1 уровня
      const exLevel1 = All_EXERCISES?.level1?.[0]
      if (exLevel1) demoTasks.push(exLevel1)

      // 2. Берем первое упражнение из 2 уровня
      const exLevel2 = All_EXERCISES?.level2?.[0]
      if (exLevel2) demoTasks.push(exLevel2)

      // 3. Берем первое упражнение из 3 уровня
      const exLevel3 = All_EXERCISES?.level3?.[0]
      if (exLevel3) demoTasks.push(exLevel3)

      // Если нашли хотя бы одно упражнение в моках — собираем их в структуру задач
      if (demoTasks.length > 0) {
        const formattedDemoTasks = demoTasks.map((ex, index) => ({
          _id: `demo-${ex.id || index}`,
          alias: ex.alias,
          title: ex.title,
          description: ex.description,
          reward: ex.reward || 30,
          goal: 1,
          currentValue: 0,
          isCompleted: false,
          locked: false
        }))

        return { tasks: formattedDemoTasks, date: new Date().toISOString(), isDemo: true }
      }
      
      return rejectWithValue(err.response?.data || 'Ошибка загрузки')
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
          const task = state.tasks.find((t) => t.alias === update.alias)
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
        state.isDemo = action.payload.isDemo // Записываем, демо это или нет
      })
      .addCase(fetchDailyTasks.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
  },
})

export const { updateTaskProgress } = dailySlice.actions
export { fetchDailyTasks }
export default dailySlice.reducer

