import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// --- ASYNC THUNKS ДЛЯ ТЯЖЕЛОЙ ДИКЦИИ ---

// 1. Старт сессии (отправка выбранного текста скороговорки на бэк)
const fetchStartPoemTongue = createAsyncThunk(
  'poemTongue/fetchStartPoemTongue',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-tongue', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте упражнения Тяжелая дикция',
      )
    }
  },
)

// Отправка записанного аудиофайла (или текста в режиме тестов)
const fetchResponsePoemTongue = createAsyncThunk(
  'poemTongue/fetchResponsePoemTongue',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        // Ключ 'audio' строго совпадает с upload.single('audio') на бэкенде
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/ai/response-tongue',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при отправке записи в упражнении Тяжелая дикция',
      )
    }
  },
)

// Запрос финального вердикта логопеда-ИИ
const fetchFinishPoemTongue = createAsyncThunk(
  'poemTongue/fetchFinishPoemTongue',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-tongue', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при получении результатов дикции',
      )
    }
  },
)

const poemTongueSlice = createSlice({
  name: 'poemTongue',
  initialState: createBaseAiState(), // Фабрика чистого базового стейта
  reducers: {
    setPoemTongueAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Мгновенный сброс памяти при перезапуске или выходе из тренажера
    resetPoemTongueState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // * СТАРТ УПРАЖНЕНИЯ *
      .addCase(fetchStartPoemTongue.pending, setAiPending)
      .addCase(fetchStartPoemTongue.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview, // Приветствие ИИ с текстом скороговорки
          },
        ]
      })
      .addCase(fetchStartPoemTongue.rejected, setAiRejected)

      // * ОБРАБОТКА ОТВЕТА ПОЛЬЗОВАТЕЛЯ *
      .addCase(fetchResponsePoemTongue.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponsePoemTongue.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Пушим расшифровку от SaluteSpeech, чтобы пользователь видел свои оговорки на экране
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        // Сервисный ответ ИИ
        state.messages.push({
          role: 'assistant',
          text: answer,
        })

        // Так как ход один, переводим сессию в finished для разблокировки кнопки результатов
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponsePoemTongue.rejected, (state, action) => {
        state.exStatus = 'idle'
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop() // Откат истории при сбое сети
        }
        state.error = action.payload
      })

      // * ПОЛУЧЕНИЕ ВЕРДИКТА ЖЮРИ *
      .addCase(fetchFinishPoemTongue.pending, setAiPending)
      .addCase(fetchFinishPoemTongue.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'

        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result // Сюда прилетят dictionPurity, breathing, errorsCount
        }
      })
      .addCase(fetchFinishPoemTongue.rejected, setAiRejected)
  },
})

export const { setPoemTongueAiStatus, resetPoemTongueState } =
  poemTongueSlice.actions

export {
  fetchStartPoemTongue,
  fetchResponsePoemTongue,
  fetchFinishPoemTongue,
}

export default poemTongueSlice.reducer
