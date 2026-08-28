import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт тренажера
export const fetchStartDeafPassengerTrainer = createAsyncThunk(
  'course/fetchStartDeafPassengerTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/deaf-passenger/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка старта тренажера Попутчик-Глухарь',
        },
      )
    }
  },
)

// 2. Отправка аудиозаписи ответа (FormData)
export const fetchSendDeafPassengerResponse = createAsyncThunk(
  'course/fetchSendDeafPassengerResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'deaf_passenger_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/deaf-passenger/respond',
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
          'Ошибка отправки ответа рассказчику',
      )
    }
  },
)

// 3. Завершение тренажера и получение аналитики
export const fetchFinishDeafPassengerTrainer = createAsyncThunk(
  'course/fetchFinishDeafPassengerTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/question-architect/deaf-passenger/finish',
        { courseCode },
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации тренажера Попутчик-Глухарь',
        },
      )
    }
  },
)
