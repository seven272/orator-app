import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance' // Ваш инстанс axios

// 1. Старт тренажера питча
const fetchStartPitchTrainer = createAsyncThunk(
  'course/fetchStartPitchTrainer',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/pitch/start',
        {
          courseCode,
          exerciseData,
        },
      )
      return res.data // Возвращает { preview, question }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка старта питча' },
      )
    }
  },
)

// 2. Отправка ответа (поддерживает и текст, и аудио-файл FormData)
const fetchSendPitchResponse = createAsyncThunk(
  'course/fetchSendPitchResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode) // Передаем код курса строкой внутри мультипарта
      formData.append('file', audioBlob, 'pitch_speech.wav') // Ключ 'file', как ждет бэкенд

      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/pitch/respond',
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
          'Ошибка отправки голосовой реплики',
      )
    }
  },
)

// 3. Завершение тренажера питча (получение оценок и обновление прогресса)
const fetchFinishPitchTrainer = createAsyncThunk(
  'course/fetchFinishPitchTrainer',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/pitch-master/pitch/finish',
        { courseCode },
      )
      return res.data // Возвращает { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка финализации питча',
        },
      )
    }
  },
)

export {
  fetchStartPitchTrainer,
  fetchFinishPitchTrainer,
  fetchSendPitchResponse,
}
