import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartStreetRudeness = createAsyncThunk(
  'course/fetchStartStreetRudeness',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/social-shield/street-rudeness/start', { courseCode, exerciseData })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка старта тренажера хамства' })
    }
  }
)

export const fetchSendStreetRudenessResponse = createAsyncThunk(
  'course/fetchSendStreetRudenessResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'street_rudeness_speech.wav')

      const res = await axiosInstance.post('/courses/simulate/social-shield/street-rudeness/respond', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Ошибка отправки ответа')
    }
  }
)

export const fetchFinishStreetRudeness = createAsyncThunk(
  'course/fetchFinishStreetRudeness',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/courses/simulate/social-shield/street-rudeness/finish', { courseCode })
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Ошибка финализации сессии' })
    }
  }
) 
