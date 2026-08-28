import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// --- ASYNC THUNKS ДЛЯ УПРАЖНЕНИЯ АНТИ-СЛОВА ---

// 1. Старт сессии (отправка темы задания и списков табу-слов)
const fetchStartStopWord = createAsyncThunk(
  'aiStopWord/fetchStartStopWord',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-stop-word', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте упражнения Анти-слова',
      )
    }
  },
)

// 2. Отправка аудиофайла с речью пользователя
const fetchResponseStopWord = createAsyncThunk(
  'aiStopWord/fetchResponseStopWord',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        // Ключ строго 'audio' под ваш бэкенд-Multer
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/ai/response-stop-word',
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
          'Ошибка сервера при отправке речи в упражнении Анти-слова',
      )
    }
  },
)

// 3. Запрос финального вердикта ИИ-цензора
const fetchFinishStopWord = createAsyncThunk(
  'aiStopWord/fetchFinishStopWord',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-stop-word', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при получении аналитики Анти-слов',
      )
    }
  },
)

const stopWordSlice = createSlice({
  name: 'stopWord',
  initialState: createBaseAiState(), // Фабрика чистого базового стейта
  reducers: {
    setStopWordAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Мгновенный сброс памяти при перезапуске сессии или выходе из тренажера
    resetStopWordState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // * СТАРТ СЕССИИ *
      .addCase(fetchStartStopWord.pending, setAiPending)
      .addCase(fetchStartStopWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview, // Приветствие ИИ с перечислением ограничений
          },
        ]
      })
      .addCase(fetchStartStopWord.rejected, setAiRejected)

      // * ОБРАБОТКА АУДИОЗАПИСИ *
      .addCase(fetchResponseStopWord.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponseStopWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Пушим расшифровку, чтобы оратор видел, где проскочили паразиты
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

        // Переводим сессию в finished для разблокировки кнопки итогов
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseStopWord.rejected, (state, action) => {
        state.exStatus = 'idle'
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop() // Удаляем сообщение пользователя при сбое
        }
        state.error = action.payload
      })

      // * ИТОГОВЫЙ ВЕРДИКТ ЦЕНЗОРА *
      .addCase(fetchFinishStopWord.pending, setAiPending)
      .addCase(fetchFinishStopWord.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'

        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result // Сюда прилетят tabooControl, vocabulary, speechPurity
        }
      })
      .addCase(fetchFinishStopWord.rejected, setAiRejected)
  },
})

export const { setStopWordAiStatus, resetStopWordState } =
  stopWordSlice.actions

export {
  fetchStartStopWord,
  fetchResponseStopWord,
  fetchFinishStopWord,
}

export default stopWordSlice.reducer
