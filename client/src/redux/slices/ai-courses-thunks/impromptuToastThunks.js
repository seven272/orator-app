import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartImpromptuToast = createAsyncThunk(
  'course/fetchStartImpromptuToast',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/impromptu-toast/start',
        { courseCode, exerciseData },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка старта тренажера экспромта',
        },
      )
    }
  },
)

export const fetchSendImpromptuResponse = createAsyncThunk(
  'course/fetchSendImpromptuResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'impromptu_toast_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/impromptu-toast/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки ответа',
      )
    }
  },
)

export const fetchFinishImpromptuToast = createAsyncThunk(
  'course/fetchFinishImpromptuToast',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/impromptu-toast/finish',
        { courseCode },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации сессии',
        },
      )
    }
  },
)
