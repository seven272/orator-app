import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт скрининга (Инициализация созвона)
export const fetchStartHrScreener = createAsyncThunk(
  'course/fetchStartHrScreener',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/hr-screener/start',
        { courseCode, exerciseData }
      )
      return res.data // { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта HR-скрининга' }
      )
    }
  }
)

// 2. Отправка голосового ответа рекрутеру (FormData)
export const fetchSendHrScreenerResponse = createAsyncThunk(
  'course/fetchSendHrScreenerResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'hr_screener_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/hr-screener/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return res.data // { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки ответа рекрутеру'
      )
    }
  }
)

// 3. Завершение скрининга (Анализ софт-скиллов и структуры STAR)
export const fetchFinishHrScreener = createAsyncThunk(
  'course/fetchFinishHrScreener',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/hr-storm/hr-screener/finish',
        { courseCode }
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка получения отчета рекрутера' }
      )
    }
  }
)
