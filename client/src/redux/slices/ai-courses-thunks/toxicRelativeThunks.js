import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartToxicRelative = createAsyncThunk(
  'course/fetchStartToxicRelative',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/social-shield/toxic-relative/start', { courseCode, exerciseData })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка старта тренажера манипуляций' })
    }
  }
)

export const fetchSendToxicRelativeResponse = createAsyncThunk(
  'course/fetchSendToxicRelativeResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'toxic_relative_speech.wav')

      const res = await axiosInstance.post('/courses/simulate/social-shield/toxic-relative/respond', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка отправки ответа')
    }
  }
)

export const fetchFinishToxicRelative = createAsyncThunk(
  'course/fetchFinishToxicRelative', 
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/social-shield/toxic-relative/finish', { courseCode })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка финализации сессии' })
    }
  }
)
