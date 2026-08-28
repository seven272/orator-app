import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт тренажера возражений
const fetchStartObjectionTrainer = createAsyncThunk(
  'course/fetchStartObjectionTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/objection/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта тренажера возражений' },
      )
    }
  },
)

// 2. Отправка ответа на возражение (FormData)
const fetchSendObjectionResponse = createAsyncThunk(
  'course/fetchSendObjectionResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'objection_speech.wav') // Кастомное имя файла

      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/objection/respond',
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
          'Ошибка отправки ответа на возражение',
      )
    }
  },
)

// 3. Завершение тренажера возражений и получение аналитики
const fetchFinishObjectionTrainer = createAsyncThunk(
  'course/fetchFinishObjectionTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/objection/finish',
        { courseCode },
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации тренажера возражений',
        },
      )
    }
  },
)

export {
  fetchStartObjectionTrainer,
  fetchSendObjectionResponse,
  fetchFinishObjectionTrainer,
}
