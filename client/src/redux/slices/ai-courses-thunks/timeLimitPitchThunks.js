import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartTimeLimitPitch = createAsyncThunk(
  'course/fetchStartTimeLimitPitch',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/media-speaker/time-limit-pitch/start', { courseCode, exerciseData })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка старта тренажера цейтнота' })
    }
  }
)

export const fetchSendTimeLimitResponse = createAsyncThunk(
  'course/fetchSendTimeLimitResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'time_limit_pitch_speech.wav')

      const res = await axiosInstance.post('/courses/simulate/media-speaker/time-limit-pitch/respond', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка отправки ответа')
    }
  }
)

export const fetchFinishTimeLimitPitch = createAsyncThunk(
  'course/fetchFinishTimeLimitPitch',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/media-speaker/time-limit-pitch/finish', { courseCode })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка финализации сессии' })
    }
  }
)
