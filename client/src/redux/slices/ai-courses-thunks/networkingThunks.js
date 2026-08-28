// frontend/src/redux/ai-courses-thunks/networkingThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance' // Ваш инстанс axios

// 1. Старт тренажера Нетворкинга (Инициализация)
const fetchStartNetworking = createAsyncThunk(
  'course/fetchStartNetworking',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/networking-expert/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка старта тренажера нетворкинга',
        },
      )
    }
  },
)

// 2. Отправка голосового ответа собеседнику на конференции (FormData)
const fetchSendNetworkingResponse = createAsyncThunk(
  'course/fetchSendNetworkingResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'networking_speech.wav') // Ключ 'file' для multer на бэкенде

      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/networking-expert/respond',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return res.data // Возвращает { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка отправки реплики собеседнику',
      )
    }
  },
)

// 3. Завершение тренажера нетворкинга (ИИ-анализ и начисление баллов)
const fetchFinishNetworking = createAsyncThunk(
  'course/fetchFinishNetworking',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/networking-expert/finish',
        { courseCode },
      )
      return res.data // Возвращает { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации нетворк-сессии',
        },
      )
    }
  },
)

export {
  fetchStartNetworking,
  fetchSendNetworkingResponse,
  fetchFinishNetworking, 
}
