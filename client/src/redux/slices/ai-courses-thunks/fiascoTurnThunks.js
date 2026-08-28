// frontend/src/redux/slices/ai-courses-thunks/fiascoTurnThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

const fetchStartFiascoTurn = createAsyncThunk(
  'course/fetchStartFiascoTurn',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/story-master/fiasco-turn/start',
        { courseCode, exerciseData },
      )
      return res.data // Ожидается: { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка запуска тренировки разбора ошибок',
        },
      )
    }
  },
)

const fetchSendFiascoTurnResponse = createAsyncThunk(
  'course/fetchSendFiascoTurnResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'fiasco_turn_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/story-master/fiasco-turn/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data // Ожидается: { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка отправки реплики разбора ошибок на сервер',
      )
    }
  },
)

const fetchFinishFiascoTurn = createAsyncThunk(
  'course/fetchFinishFiascoTurn',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/story-master/fiasco-turn/finish',
        { courseCode },
      )
      return res.data // Ожидается: { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка получения анализа искренности',
        },
      )
    }
  },
)

export {
  fetchStartFiascoTurn,
  fetchSendFiascoTurnResponse,
  fetchFinishFiascoTurn,
}
