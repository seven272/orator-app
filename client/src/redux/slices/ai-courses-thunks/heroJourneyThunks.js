// frontend/src/redux/slices/ai-courses-thunks/heroJourneyThunks.js

import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт тренировки "Путь героя"
const fetchStartHeroJourney = createAsyncThunk(
  'course/fetchStartHeroJourney',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      console.log(courseCode)
      const res = await axiosInstance.post(
        '/courses/simulate/story-master/hero-journey/start',
        { courseCode, exerciseData },
      )
      return res.data // Ожидается: { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка запуска тренировки построения истории',
        },
      )
    }
  },
)

// 2. Отправка устной реплики (FormData)
const fetchSendHeroJourneyResponse = createAsyncThunk(
  'course/fetchSendHeroJourneyResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'hero_journey_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/story-master/hero-journey/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data // Ожидается: { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка отправки устного ответа на сервер',
      )
    }
  },
)

// 3. Завершение тренировки (Оценка драматургии и смыслового крючка)
const fetchFinishHeroJourney = createAsyncThunk(
  'course/fetchFinishHeroJourney',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/story-master/hero-journey/finish',
        { courseCode },
      )
      return res.data // Ожидается: { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || {
          message: 'Ошибка получения анализа структуры истории',
        },
      )
    }
  },
)
export {
  fetchStartHeroJourney,
  fetchSendHeroJourneyResponse,
  fetchFinishHeroJourney,
}
