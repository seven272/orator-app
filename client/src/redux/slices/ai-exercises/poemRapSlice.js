import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// Старт сессии (отправка выбранного текста стиха и ритмических ориентиров на бэк)
const fetchStartPoemRap = createAsyncThunk(
  'poemRap/fetchStartPoemRap',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-rap', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте упражнения Рэп-манифест',
      )
    }
  },
)

//  Отправка записанного аудиофайла читки
const fetchResponsePoemRap = createAsyncThunk(
  'poemRap/fetchResponsePoemRap',
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
        '/ai/response-rap',
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
          'Ошибка сервера при отправке трека в упражнении Рэп-манифест',
      )
    }
  },
)

// 3. Запрос финального вердикта от ИИ-продюсера
const fetchFinishPoemRap = createAsyncThunk(
  'poemRap/fetchFinishPoemRap',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-rap', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при получении музыкального анализа трека',
      )
    }
  },
)

const poemRapSlice = createSlice({
  name: 'poemRap',
  initialState: createBaseAiState(), // Фабрика чистого базового стейта
  reducers: {
    setPoemRapAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Мгновенный сброс памяти при перезапуске или закрытии экрана
    resetPoemRapState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // * СТАРТ УПРАЖНЕНИЯ *
      .addCase(fetchStartPoemRap.pending, setAiPending)
      .addCase(fetchStartPoemRap.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview, // Приветствие продюсера со стихом и флоу-ориентирами
          },
        ]
      })
      .addCase(fetchStartPoemRap.rejected, setAiRejected)

      // * ОБРАБОТКА РАСПОЗНАННОГО ТРЕКА *
      .addCase(fetchResponsePoemRap.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponsePoemRap.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Пушим расшифровку, чтобы оратор видел, насколько четко он зачитал слова
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

        // Переводим сессию в finished для активации кнопки финального анализа
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponsePoemRap.rejected, (state, action) => {
        state.exStatus = 'idle'
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop() // Удаляем сообщение из локального чата, если сервер упал
        }
        state.error = action.payload
      })

      // * СВЕДЕНИЕ И ПОЛУЧЕНИЕ ОЦЕНОК ИИ *
      .addCase(fetchFinishPoemRap.pending, setAiPending)
      .addCase(fetchFinishPoemRap.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'

        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result // Сюда прилетят rhythm, articulation, drive
        }
      })
      .addCase(fetchFinishPoemRap.rejected, setAiRejected)
  },
})

export const { setPoemRapAiStatus, resetPoemRapState } =
  poemRapSlice.actions

export { fetchStartPoemRap, fetchResponsePoemRap, fetchFinishPoemRap }

export default poemRapSlice.reducer
