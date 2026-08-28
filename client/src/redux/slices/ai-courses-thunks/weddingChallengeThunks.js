import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

export const fetchStartWeddingChallenge = createAsyncThunk(
  'course/fetchStartWeddingChallenge',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/wedding-challenge/start',
        { courseCode, exerciseData },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка старта свадебного тренажера',
        },
      )
    }
  },
)

export const fetchSendWeddingResponse = createAsyncThunk(
  'course/fetchSendWeddingResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append(
        'file',
        audioBlob,
        'wedding_challenge_speech.wav',
      )

      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/wedding-challenge/respond',
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

export const fetchFinishWeddingChallenge = createAsyncThunk(
  'course/fetchFinishWeddingChallenge',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/toast-master/wedding-challenge/finish',
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
