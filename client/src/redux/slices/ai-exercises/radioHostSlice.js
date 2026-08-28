import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// --- ASYNC THUNKS ДЛЯ РАДИОВЕДУЩЕГО ---

// 1. Старт сессии (отправка сгенерированных новостей, погоды и трека на бэк)
 const fetchStartRadioHost = createAsyncThunk(
  'radioHost/fetchStartRadioHost',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-radio', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте упражнения Радиоведущий',
      )
    }
  },
)

// 2. Отправка записанного аудиофайла прямого эфира
const fetchResponseRadioHost = createAsyncThunk(
  'radioHost/fetchResponseRadioHost',
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
        '/ai/response-radio',
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
          'Ошибка сервера при отправке эфира в упражнении Радиоведущий',
      )
    }
  },
)

// 3. Запрос финального вердикта от программного директора-ИИ
const fetchFinishRadioHost = createAsyncThunk(
  'radioHost/fetchFinishRadioHost',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-radio', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при получении рецензии на эфирный перерыв',
      )
    }
  },
)

const radioHostSlice = createSlice({
  name: 'radioHost',
  initialState: createBaseAiState(), // Фабрика чистого базового стейта
  reducers: {
    setRadioHostAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Мгновенный сброс памяти при перезапуске или закрытии экрана
    resetRadioHostState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // * СТАРТ УПРАЖНЕНИЯ *
      .addCase(fetchStartRadioHost.pending, setAiPending)
      .addCase(fetchStartRadioHost.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview, // Вводное приветствие радиостанции с ТЗ для эфира
          },
        ]
      })
      .addCase(fetchStartRadioHost.rejected, setAiRejected)

      // * ОБРАБОТКА ЗАПИСИ ПРЯМОГО ЭФИРА *
      .addCase(fetchResponseRadioHost.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponseRadioHost.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Пушим расшифровку SaluteSpeech, чтобы оратор видел свой текст со всеми "эээ" и повторами
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
      .addCase(fetchResponseRadioHost.rejected, (state, action) => {
        state.exStatus = 'idle'
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop() // Удаляем сообщение из локального чата, если сервер упал
        }
        state.error = action.payload
      })

      // * ПОЛУЧЕНИЕ РЕЦЕНЗИИ И ОЦЕНОК ДИРЕКТОРА *
      .addCase(fetchFinishRadioHost.pending, setAiPending)
      .addCase(fetchFinishRadioHost.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result // Сюда прилетят tempo, pauseless, positivity
        }
      })
      .addCase(fetchFinishRadioHost.rejected, setAiRejected)
  },
})

export const { setRadioHostAiStatus, resetRadioHostState } =
  radioHostSlice.actions

export {fetchStartRadioHost, fetchResponseRadioHost, fetchFinishRadioHost}

export default radioHostSlice.reducer
