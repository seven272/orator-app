// frontend/src/redux/ai-courses-thunks/vipCloseThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance' // Ваш инстанс axios

// 1. Старт тренажера Встреча на миллион (Инициализация)
const fetchStartVipClose = createAsyncThunk(
  'course/fetchStartVipClose',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/vip-client-close/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера VIP-клиента' },
      )
    }
  },
)

// 2. Отправка голосового ответа (Передача аудио-файла FormData)
const fetchSendVipResponse = createAsyncThunk(
  'course/fetchSendVipResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode) // Передаем код курса строкой
      formData.append('file', audioBlob, 'vip_close_speech.wav') // Ключ 'file', как ждет бэкенд в multer

      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/vip-client-close/respond',
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
        error.response?.data?.message || 'Ошибка отправки реплики клиенту',
      )
    }
  },
)

// 3. Завершение тренажера VIP-клиента (Расчет критериев и финализация)
const fetchFinishVipClose = createAsyncThunk(
  'course/fetchFinishVipClose',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/self-pitch-pro/vip-client-close/finish',
        { courseCode },
      )
      return res.data // Возвращает { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка финализации переговоров' },
      )
    }
  },
)

export {
  fetchStartVipClose,
  fetchSendVipResponse,
  fetchFinishVipClose,
}
