import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../../utils/axiosInstance'
import {
  createBaseAiState,
  setAiPending,
  setAiRejected,
} from '../../utils/baseAiState'

const fetchStartDebate = createAsyncThunk(
  'aiExercise/fetchStartDebate',
  async ({ topic, position }, { rejectWithValue }) => {
    const exerciseData = {
      topic,
      position,
    }
    try {
      const res = await axiosInstance.post('/ai/start-debate', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте дебатов'
      return rejectWithValue(errorMsg)
    }
  },
)
const fetchSendUserResponseDebate = createAsyncThunk(
  'aiExercise/fetchSendUserResponseDebate',
  async ({ audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()

      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Шлем эталонный WAV для синхронного STT
      }

      const res = await axiosInstance.post(
        '/ai/response-debate',
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
        'Ошибка сервера при отправке ответа'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishDebate = createAsyncThunk(
  'aiExercise/fetchFinishDebate',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-debate', {
        isDaily,
      })
      return res.data // Ожидаем объект с totalScore, feedback и criteria
    } catch (error) {
      console.log(error)
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при получении вердикта дебатов',
      )
    }
  },
)

const debateSlice = createSlice({
  name: 'debate',
  initialState: createBaseAiState(), // Используем фабрику базового стейта
  reducers: {
    setDebateAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetDebateState: () => {
      // Полный возврат к дефолту одной строкой, Immer увидит return и заменит стейт целиком
      return createBaseAiState()
    },
  },
  extraReducers: (builder) => {
    builder
      // Старт
      .addCase(fetchStartDebate.pending, setAiPending)
      .addCase(fetchStartDebate.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.messages = [
          { role: 'assistant', text: action.payload.answer },
        ]
      })
      .addCase(fetchStartDebate.rejected, setAiRejected)

      // Диалог
      .addCase(
        fetchSendUserResponseDebate.pending,
        (state) => {
          setAiPending(state)
          
        },
      )
      .addCase(
        fetchSendUserResponseDebate.fulfilled,
        (state, action) => {
          state.exStatus = 'succeeded'
          const { answer, isDebateFinished, user_transcript } =
            action.payload

          // Если шла аудиозапись, вытаскиваем распознанный Сбером текст и вставляем перед репликой ИИ
          if (user_transcript) {
            state.messages.push({
              role: 'user',
              text: user_transcript,
            })
          }

          // Если это был финальный раунд (3-й ход), переводим сессию в finished
          if (isDebateFinished) {
            state.aiStatus = 'finished'
          } else {
            // Если дебаты продолжаются — добавляем контраргумент ИИ-оппонента на экран
            state.messages.push({
              role: 'assistant',
              text: answer,
            })
            state.aiStatus = 'idle'
          }
        },
      )
      .addCase(
        fetchSendUserResponseDebate.rejected,
        (state, action) => {
          state.exStatus = 'idle'
          // Удаляем последнее сообщение пользователя, так как ответ от ИИ не пришел. at это новый метод работы с массивами в js который возвращает элемент по индексу (-1 последний индекс)
          if (state.messages.at(-1)?.role === 'user')
            state.messages.pop()
          state.error = action.payload
        },
      )
      // Финиш
      .addCase(fetchFinishDebate.pending, setAiPending)
      .addCase(fetchFinishDebate.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishDebate.rejected, setAiRejected)
  },
})

export const { setDebateAiStatus, resetDebateState } =
  debateSlice.actions
export {
  fetchStartDebate,
  fetchSendUserResponseDebate,
  fetchFinishDebate,
}
export default debateSlice.reducer
