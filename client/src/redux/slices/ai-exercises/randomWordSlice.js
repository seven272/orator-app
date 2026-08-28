import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartRandomWord = createAsyncThunk(
  'randomWord/fetchStartRandomWord',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-random-word', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка старта импровизации',
      )
    }
  },
)

const fetchResponseRandomWord = createAsyncThunk(
  'randomWord/fetchResponseRandomWord',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/ai/response-random-word',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки аудио',
      )
    }
  },
)

const fetchFinishRandomWord = createAsyncThunk(
  'randomWord/fetchFinishRandomWord',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-random-word', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка финала импровизации',
      )
    }
  },
)

const randomWordSlice = createSlice({
  name: 'randomWord',
  initialState: createBaseAiState(),
  reducers: {
    setRandomWordAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetRandomWordState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStartRandomWord.pending, setAiPending)
      .addCase(fetchStartRandomWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.preview },
        ]
      })
      .addCase(fetchStartRandomWord.rejected, setAiRejected)

      .addCase(fetchResponseRandomWord.pending, (state, action) => {
        if (action.meta.arg.userMessage) {
          state.messages.push({
            role: 'user',
            text: action.meta.arg.userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponseRandomWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload
        if (user_transcript)
          state.messages.push({ role: 'user', text: user_transcript })
        state.messages.push({ role: 'assistant', text: answer })
        state.aiStatus = isFinished ? 'finished' : 'idle'
      })
      .addCase(fetchResponseRandomWord.rejected, (state, action) => {
        state.exStatus = 'idle'
        if (state.messages.at(-1)?.role === 'user')
          state.messages.pop()
        state.error = action.payload
      })

      .addCase(fetchFinishRandomWord.pending, setAiPending)
      .addCase(fetchFinishRandomWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result)
          state.verdict = action.payload.session.result
      })
      .addCase(fetchFinishRandomWord.rejected, setAiRejected)
  },
})

export const { setRandomWordAiStatus, resetRandomWordState } =
  randomWordSlice.actions
export {
  fetchStartRandomWord,
  fetchResponseRandomWord,
  fetchFinishRandomWord,
}
export default randomWordSlice.reducer
