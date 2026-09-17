import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// --- ASYNC THUNKS ДЛЯ ТРЕНАЖЕРА «ЭХО ИСТОРИИ» ---

// 1. Старт сессии (отправка выбранного исторического сценария на бэк)
const fetchStartHistorical = createAsyncThunk(
  'historical/fetchStartHistorical',
  async (exerciseData, { rejectWithValue }) => {
    console.log(exerciseData)
    try {
      const res = await axiosInstance.post('/ai/start-historical', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте тренажера Эхо Истории',
      )
    }
  },
)

// 2. Отправка аудиозаписи речи на бэк для транскрибации Яндексом
const fetchResponseHistorical = createAsyncThunk(
  'historical/fetchResponseHistorical',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        // КЛЮЧ 'audio' строго совпадает с upload.single('audio') на бэкенде!
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        // Текстовый резервный вариант для тестов
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/ai/response-historical',
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
          'Ошибка сервера при обработке вашей речи ИИ-судьей',
      )
    }
  },
)

// 3. Завершение упражнения и получение JSON-аналитики от GigaChat
const fetchFinishHistorical = createAsyncThunk(
  'historical/fetchFinishHistorical',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-historical', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при получении вердикта ИИ-судьи',
      )
    }
  },
)

const historicalSlice = createSlice({
  name: 'historical',
  initialState: createBaseAiState(), // Фабрика базового стейта (messages, exStatus, aiStatus, error, verdict)
  reducers: {
    setHistoricalAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Мгновенный сброс состояния при выходе из тренажера
    resetHistoricalState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // --- СТАРТ ТРЕНАЖЕРА ---
      .addCase(fetchStartHistorical.pending, setAiPending)
      .addCase(fetchStartHistorical.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        // Очищаем стейт и пушим приветственный текст с инструкцией оратора
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview,
          },
        ]
      })
      .addCase(fetchStartHistorical.rejected, setAiRejected)

      // --- ОТПРАВКА И РАСПОЗНАВАНИЕ РЕЧИ ---
      .addCase(fetchResponseHistorical.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponseHistorical.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Если пришел текст от Яндекса, реактивно добавляем его в историю
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        // Добавляем технический ответ-подтверждение от ассистента
        state.messages.push({
          role: 'assistant',
          text: answer,
        })

        // Переключаем статус UI
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseHistorical.rejected, (state, action) => {
        state.exStatus = 'idle'
        // Пессимистичный откат: стираем ложный месседж юзера, если бэк выдал ошибку
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // --- ПОЛУЧЕНИЕ ФИНАЛЬНОГО ВЕРДИКТА ---
      .addCase(fetchFinishHistorical.pending, setAiPending)
      .addCase(fetchFinishHistorical.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'

        // Напрямую записываем результат из вложенного объекта бэкенд-сессии
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishHistorical.rejected, setAiRejected)
  },
})

export const { setHistoricalAiStatus, resetHistoricalState } =
  historicalSlice.actions
export {
  fetchStartHistorical,
  fetchResponseHistorical,
  fetchFinishHistorical,
}
export default historicalSlice.reducer
