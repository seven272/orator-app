import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

// --- ASYNC THUNKS СТРОГО ДЛЯ ТРИБУНЫ ---

// Старт сессии Трибуны (получение темы/задания для монолога)
const fetchStartTribune = createAsyncThunk(
  'tribune/fetchStartTribune',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-tribune', {
        exerciseData,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при старте упражнения Трибуна',
      )
    }
  },
)

const fetchResponseTribune = createAsyncThunk(
  'aiExercise/fetchResponseTribune',
  async ({ audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      // 1. Создаем объект FormData для multipart/form-data запроса
      const formData = new FormData()

      // 2. Проверяем, что пришло: файл или текст
      if (audioBlob) {
        // Добавляем аудиофайл. Ключ должен строго называться 'audio' для бэкенд-Multer!
        // Третий параметр — имя файла. Расширение wav
        formData.append('audio', audioBlob, 'speech.wav')
      } else if (userMessage) {
        // Резервный текстовый вариант (для обратной совместимости и тестов)
        formData.append('userMessage', userMessage)
      }

      // 3. Отправляем FormData. Axios сам выставит нужные boundary в Content-Type
      const res = await axiosInstance.post(
        '/ai/response-tribune',
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
          'Ошибка сервера при ответе пользователю в упражнении Трибуна',
      )
    }
  },
)

const fetchFinishTribune = createAsyncThunk(
  'aiExercise/fetchFinishTribune',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-tribune', {
        isDaily,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при завершении упражнения трибуна',
      )
    }
  },
)

const tribuneSlice = createSlice({
  name: 'tribune',
  initialState: createBaseAiState(), // Используем фабрику базового стейта
  reducers: {
    setTribuneAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    // Стрелочная функция для мгновенного и чистого сброса без утечек памяти
    resetTribuneState: () => createBaseAiState(),
  },
  extraReducers: (builder) => {
    builder
      // *Запрос на старт Трибуна*
      .addCase(fetchStartTribune.pending, setAiPending)
      .addCase(fetchStartTribune.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        // Очищаем историю и добавляем первое сообщение от ИИ
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview,
          },
        ]
      })
      .addCase(fetchStartTribune.rejected, setAiRejected)

      // *Запрос на ответ пользователя Трибуна*
      .addCase(fetchResponseTribune.pending, (state, action) => {
        const userMessage = action.meta.arg.userMessage
        // Добавляем сообщение в чат СРАЗУ, только если это был текстовый ввод
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        setAiPending(state)
      })
      .addCase(fetchResponseTribune.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        // Если была отправлена аудиозапись, вытаскиваем распознанный Сбером текст
        // и добавляем его в историю ПЕРЕД ответом ассистента
        if (user_transcript) {
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        // Пушим ответ ИИ-оппонента
        state.messages.push({
          role: 'assistant',
          text: answer,
        })

        // Выставляем правильный статус сессии
        if (isFinished) {
          state.aiStatus = 'finished'
        } else {
          state.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseTribune.rejected, (state, action) => {
        state.exStatus = 'idle' // Переводим в idle для разблокировки UI кнопки записи

        // Защита: удаляем последнее сообщение пользователя, так как ответ ИИ не сгенерировался
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop()
        }
        state.error = action.payload
      })

      // *Вердикт ИИ за Трибуна*
      .addCase(fetchFinishTribune.pending, setAiPending)
      .addCase(fetchFinishTribune.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'

        // Забираем вердикт строго из вложенной сессии согласно ответу нашего сервера
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishTribune.rejected, setAiRejected)
  },
})

export const { setTribuneAiStatus, resetTribuneState } =
  tribuneSlice.actions
export { fetchFinishTribune, fetchResponseTribune, fetchStartTribune }
export default tribuneSlice.reducer
