import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт Small Talk у бара
export const fetchStartBarSmallTalk = createAsyncThunk(
  'course/fetchStartBarSmallTalk',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/bar-small-talk/start',
        { courseCode, exerciseData }
      )
      return res.data // { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка инициализации разговора у бара' }
      )
    }
  }
)

// 2. Отправка аудио-реплики барному собеседнику (FormData)
export const fetchSendBarSmallTalkResponse = createAsyncThunk(
  'course/fetchSendBarSmallTalkResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'bar_small_talk_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/bar-small-talk/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return res.data // { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки реплики собеседнику'
      )
    }
  }
)

// 3. Завершение Small Talk (Оценка iceBreaking и conversationalFlow)
export const fetchFinishBarSmallTalk = createAsyncThunk(
  'course/fetchFinishBarSmallTalk',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/bar-small-talk/finish',
        { courseCode }
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка получения анализа Small Talk' }
      )
    }
  }
)
