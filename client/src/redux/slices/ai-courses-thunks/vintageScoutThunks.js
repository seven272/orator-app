import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт тренажера
export const fetchStartVintageScoutTrainer = createAsyncThunk(
  'course/fetchStartVintageScoutTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/vintage-scout/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка старта тренажера Винтажный раритет',
        },
      )
    }
  },
)

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendVintageScoutResponse = createAsyncThunk(
  'course/fetchSendVintageScoutResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'vintage_scout_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/vintage-scout/respond',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return res.data // { user_transcript, answer, isPitchFinished }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка отправки ответа продавцу',
      )
    }
  },
)

// 3. Завершение тренажера и получение аналитики
export const fetchFinishVintageScoutTrainer = createAsyncThunk(
  'course/fetchFinishVintageScoutTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/vintage-scout/finish',
        { courseCode },
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации тренажера Винтажный раритет',
        },
      )
    }
  },
)
