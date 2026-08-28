import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartTrollHandler = createAsyncThunk(
  'course/fetchStartTrollHandler',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/media-speaker/troll-handler/start', { courseCode, exerciseData })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка старта тренажера троллинга' })
    }
  }
)

export const fetchSendTrollResponse = createAsyncThunk(
  'course/fetchSendTrollResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'troll_handler_speech.wav')

      const res = await axiosInstance.post('/courses/simulate/media-speaker/troll-handler/respond', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка отправки ответа')
    }
  }
)

export const fetchFinishTrollHandler = createAsyncThunk(
  'course/fetchFinishTrollHandler',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/media-speaker/troll-handler/finish', { courseCode })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка финализации сессии' })
    }
  }
)
