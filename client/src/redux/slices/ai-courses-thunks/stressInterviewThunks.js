import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт стресс-интервью (Инициализация давления)
export const fetchStartStressInterview = createAsyncThunk(
  'course/fetchStartStressInterview',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/stress-interview/start',
        { courseCode, exerciseData }
      )
      return res.data // { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта стресс-интервью' }
      )
    }
  }
)

// 2. Отправка ответа под давлением (FormData)
export const fetchSendStressResponse = createAsyncThunk(
  'course/fetchSendStressResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'stress_interview_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/stress-interview/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return res.data // { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки ответа руководителю'
      )
    }
  }
)

// 3. Завершение стресс-интервью (Анализ стрессоустойчивости и рефлексии)
export const fetchFinishStressInterview = createAsyncThunk(
  'course/fetchFinishStressInterview',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/stress-interview/finish',
        { courseCode }
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации стресс-теста' }
      )
    }
  }
)
