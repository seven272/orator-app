import { createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'

// 1. Старт беседы на VIP-афтерпати
export const fetchStartVipAfterparty = createAsyncThunk(
  'course/fetchStartVipAfterparty',
  async ({ courseCode, exerciseData }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/vip-afterparty/start',
        { courseCode, exerciseData }
      )
      return res.data // { preview, question, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка входа на VIP-афтерпати' }
      )
    }
  }
)

// 2. Отправка ответа VIP-персоне (FormData)
export const fetchSendVipAfterpartyResponse = createAsyncThunk(
  'course/fetchSendVipAfterpartyResponse',
  async ({ courseCode, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('courseCode', courseCode)
      formData.append('file', audioBlob, 'vip_afterparty_speech.wav')

      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/vip-afterparty/respond',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
      return res.data // { user_transcript, answer, isSessionFinished, progressData }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка отправки ответа VIP-собеседнику'
      )
    }
  }
)

// 3. Завершение беседы (Оценка charismaStatus и ecologicalExit)
export const fetchFinishVipAfterparty = createAsyncThunk(
  'course/fetchFinishVipAfterparty',
  async ({ courseCode }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/courses/simulate/party-charisma/vip-afterparty/finish',
        { courseCode }
      )
      return res.data // { status, currentBlockIndex, progressData, evaluation }
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка получения вердикта VIP-круга' }
      )
    }
  }
)
