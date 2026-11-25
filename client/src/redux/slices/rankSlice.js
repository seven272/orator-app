import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { fetchProfileData } from './profileSlice'
import { fetchLogoutUser } from './authSlice'
import { fetchFinishRankExam } from './rankExamSlice'

// В extraReducers (builder) внутри rankSlice.js:

// 1. Получение актуального прогресса ранга (удобно вызывать после экзамена)
const fetchRankProgress = createAsyncThunk(
  'rank/fetchRankProgress',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/rank/progress')
      return response.data // { speakerProgress }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка загрузки прогресса ранга',
      )
    }
  },
)

// 2. Явное повышение ранга по кнопке
const fetchRankUp = createAsyncThunk(
  'rank/fetchRankUp',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/rank/upgrade')
      return response.data // { message, speakerProgress }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось повысить ранг',
      )
    }
  },
)

// 3. Отправка текстового отчета о реальном задании на проверку в GigaChat
const fetchSubmitRealWorldTask = createAsyncThunk(
  'rank/fetchSubmitRealWorldTask',
  async ({ targetRank, reportText }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/rank/real-task', {
        targetRank,
        reportText,
      })
      return response.data // { passed, feedback, speakerProgress }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка при проверке отчета',
      )
    }
  },
)

const initialState = {
  speakerProgress: null,
  loading: false,
  rankUpLoading: false,
  realTaskLoading: false,
  lastReportFeedback: '',
  error: null,
}

const rankSlice = createSlice({
  name: 'rank',
  initialState,
  reducers: {
    clearRankFeedback: (state) => {
      state.lastReportFeedback = ''
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Синхронизируемся при первичной загрузке дашборда из profileSlice
      .addCase(fetchProfileData.fulfilled, (state, action) => {
        if (action.payload?.speakerProgress) {
          state.speakerProgress = action.payload.speakerProgress
        }
      })
      // Сбрасываем данные при выходе из аккаунта
      .addCase(fetchLogoutUser.fulfilled, () => initialState)

      // Ручное обновление прогресса ранга
      .addCase(fetchRankProgress.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRankProgress.fulfilled, (state, action) => {
        state.loading = false
        state.speakerProgress = action.payload.speakerProgress
      })
      .addCase(fetchRankProgress.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Повышение ранга по кнопке
      .addCase(fetchRankUp.pending, (state) => {
        state.rankUpLoading = true
        state.error = null
      })
      .addCase(fetchRankUp.fulfilled, (state, action) => {
        state.rankUpLoading = false
        state.speakerProgress = action.payload.speakerProgress
      })
      .addCase(fetchRankUp.rejected, (state, action) => {
        state.rankUpLoading = false
        state.error = action.payload
      })

      // Проверка реального задания через GigaChat
      .addCase(fetchSubmitRealWorldTask.pending, (state) => {
        state.realTaskLoading = true
        state.error = null
      })
      .addCase(
        fetchSubmitRealWorldTask.fulfilled,
        (state, action) => {
          state.realTaskLoading = false
          state.lastReportFeedback = action.payload.feedback || ''
          if (action.payload.speakerProgress) {
            state.speakerProgress = action.payload.speakerProgress
          }
        },
      )
      .addCase(fetchSubmitRealWorldTask.rejected, (state, action) => {
        state.realTaskLoading = false
        state.error = action.payload
      })
      // экшен завершения экзамена
      .addCase(fetchFinishRankExam.fulfilled, (state, action) => {
        if (action.payload?.speakerProgress) {
          state.speakerProgress = action.payload.speakerProgress
        }
      })
  },
})

export const { clearRankFeedback } = rankSlice.actions
export { fetchSubmitRealWorldTask, fetchRankUp, fetchRankProgress }
export default rankSlice.reducer
