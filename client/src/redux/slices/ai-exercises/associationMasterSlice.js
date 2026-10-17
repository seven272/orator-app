import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// 1. АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS)

// Старт упражнения
const fetchStartAssociationMaster = createAsyncThunk(
  'associationMaster/fetchStartAssociationMaster',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/ai/start-association-master',
        {
          exerciseData,
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Моста смыслов'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка аудио-моста
const fetchResponseAssociationMaster = createAsyncThunk(
  'associationMaster/fetchResponseAssociationMaster',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav')
      }

      const res = await axiosInstance.post(
        '/ai/response-association-master',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при анализе ассоциации'
      return rejectWithValue(errorMsg)
    }
  },
)

// Финализация и вердикт ИИ
const fetchFinishAssociationMaster = createAsyncThunk(
  'associationMaster/fetchFinishAssociationMaster',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/ai/finish-association-master',
        {
          isDaily,
        },
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при получении вердикта лингвиста'
      return rejectWithValue(errorMsg)
    }
  },
)

// 2. СЛАЙС ТРЕНАЖЕРА
const associationMasterSlice = createSlice({
  name: 'associationMaster',
  // Расширяем базовое состояние ИИ-тренажера шкалой оригинальности
  initialState: createBaseAiState({ originality: 50 }),
  reducers: {
    setAssociationMasterAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetAssociationMasterState: () => {
      return createBaseAiState({ originality: 50 })
    },
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ---
      .addCase(fetchStartAssociationMaster.pending, setAiPending)
      .addCase(
        fetchStartAssociationMaster.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          state.originality = 50
          state.messages = [
            { role: 'assistant', text: action.payload.preview },
            { role: 'assistant', text: action.payload.question },
          ]
        },
      )
      .addCase(fetchStartAssociationMaster.rejected, setAiRejected)

      // --- ДИАЛОГ ---
      .addCase(fetchResponseAssociationMaster.pending, (state) => {
        setAiPending(state)
      })
      .addCase(
        fetchResponseAssociationMaster.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          const { answer, isFinished, originality, user_transcript } =
            action.payload

          state.originality = originality // Обновляем прогресс-бар на клиенте

          // 1. Сначала пушим распознанный текст пользователя, если он есть
          if (user_transcript) {
            state.messages.push({
              role: 'user',
              text: user_transcript,
            })
          }

          // 2. ИСПРАВЛЕНО: Мы ВСЕГДА пушим ответ ИИ в чат, чтобы пользователь его прочитал
          if (answer) {
            state.messages.push({
              role: 'assistant',
              text: answer,
            })
          }

          // 3. Переключаем статус UI нижней панели
          if (isFinished) {
            state.aiStatus = 'finished' // Активирует появление кнопки "Выслушать вердикт" в футере
          } else {
            state.aiStatus = 'idle'
          }
        },
      )
      .addCase(
        fetchResponseAssociationMaster.rejected,
        (state, action) => {
          state.exStatus = 'idle'
          if (state.messages.at(-1)?.role === 'user') {
            state.messages.pop()
          }
          state.error = action.payload
        },
      )

      // --- ФИНАЛИЗАЦИЯ ---
      .addCase(fetchFinishAssociationMaster.pending, setAiPending)
      .addCase(
        fetchFinishAssociationMaster.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          state.aiStatus = 'finished'
          if (action.payload?.session?.result) {
            state.verdict = action.payload.session.result
          }
        },
      )
      .addCase(fetchFinishAssociationMaster.rejected, setAiRejected)
  },
})

export const {
  setAssociationMasterAiStatus,
  resetAssociationMasterState,
} = associationMasterSlice.actions
export {
  fetchStartAssociationMaster,
  fetchResponseAssociationMaster,
  fetchFinishAssociationMaster,
}
export default associationMasterSlice.reducer
