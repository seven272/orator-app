import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartPoemActing = createAsyncThunk(
  'poemActing/fetchStartPoemActing',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-acting', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка старта упражнения Мастер дубляжа',
      )
    }
  },
)

const fetchResponsePoemActing = createAsyncThunk(
  'poemActing/fetchResponsePoemActing',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/ai/response-acting',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка отправки записи дубляжа',
      )
    }
  },
)

const fetchFinishPoemActing = createAsyncThunk(
  'poemActing/fetchFinishPoemActing',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-acting', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка финала Мастера дубляжа',
      )
    }
  },
)

const poemActingSlice = createSlice({
  name: 'poemActing',
  initialState: createBaseAiState(),
  reducers: {
    setPoemActingAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetPoemActingState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStartPoemActing.pending, setAiPending)
      .addCase(fetchStartPoemActing.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
        ]
      })
      .addCase(fetchStartPoemActing.rejected, setAiRejected)

      .addCase(fetchResponsePoemActing.pending, (state, action) => {
        if (action.meta.arg.userMessage) {
          state.messages.push({
            role: 'user',
            text: action.meta.arg.userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponsePoemActing.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload
        if (user_transcript) {
          state.messages.push({ role: 'user', text: user_transcript })
        }
        state.messages.push({ role: 'assistant', text: answer })
        state.aiStatus = isFinished ? 'finished' : 'idle'
      })
      .addCase(fetchResponsePoemActing.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      .addCase(fetchFinishPoemActing.pending, setAiPending)
      .addCase(fetchFinishPoemActing.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishPoemActing.rejected, setAiRejected)
  },
})

export const { setPoemActingAiStatus, resetPoemActingState } =
  poemActingSlice.actions
export {
  fetchStartPoemActing,
  fetchResponsePoemActing,
  fetchFinishPoemActing,
}
export default poemActingSlice.reducer
