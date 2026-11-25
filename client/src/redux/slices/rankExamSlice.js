import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

// 1. Старт рангового экзамена (проверка замка и получение случайного билета)
const fetchStartRankExam = createAsyncThunk(
  'rankExam/fetchStartRankExam',
  async (alias, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/rank/exam/start', {
        alias,
      })
      return res.data // { sessionId, examMeta, ticketData, preview }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Не удалось запустить экзамен. Проверьте выполнение базовых условий.',
      )
    }
  },
)

// 2. Отправка аудиозаписи (или текста) монолога на распознавание в SalutSpeech
const fetchResponseRankExam = createAsyncThunk(
  'rankExam/fetchResponseRankExam',
  async ({ alias, audioBlob, userMessage }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('alias', alias)

      if (audioBlob) {
        formData.append('audio', audioBlob, 'exam_speech.wav')
      } else if (userMessage) {
        formData.append('userMessage', userMessage)
      }

      const res = await axiosInstance.post(
        '/rank/exam/response',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      )

      return res.data // { user_transcript, answer, isFinished, isError }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при распознавании экзаменационной речи',
      )
    }
  },
)

// 3. Финализация экзамена и получение вердикта ИИ-судьи
const fetchFinishRankExam = createAsyncThunk(
  'rankExam/fetchFinishRankExam',
  async ({ alias, ticketId, userSpeech }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/rank/exam/finish', {
        alias,
        ticketId,
        userSpeech,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка сервера при оценке экзамена',
      )
    }
  },
)

const initialState = {
  sessionId: null,
  examMeta: null, // { alias, title, subtitle, timeLimit, minScore, criteriaLabels }
  ticketData: null, // { id, topic, task, context, constraints }
  userSpeech: '',
  messages: [],
  exStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  aiStatus: 'idle', // 'idle' | 'recording' | 'processing' | 'ai_thinking' | 'finished'
  verdict: null, // { totalScore, feedback, criteria }
  passed: false,
  minScore: 80,
  error: null,
}

const rankExamSlice = createSlice({
  name: 'rankExam',
  initialState,
  reducers: {
    setRankExamAiStatus: (state, action) => {
      state.aiStatus = action.payload
    },
    resetRankExamState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --- Старт экзамена ---
      .addCase(fetchStartRankExam.pending, (state) => {
        state.exStatus = 'loading'
        state.error = null
      })
      .addCase(fetchStartRankExam.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'idle'
        state.sessionId = action.payload.sessionId
        state.examMeta = action.payload.examMeta
        state.ticketData = action.payload.ticketData
        state.minScore = action.payload.examMeta?.minScore ?? 80
        state.passed = false
        state.verdict = null
        state.messages = [
          {
            role: 'assistant',
            text: action.payload.preview,
          },
        ]
      })
      .addCase(fetchStartRankExam.rejected, (state, action) => {
        state.exStatus = 'failed'
        state.error = action.payload
      })

      // --- Отправка монолога ---
      .addCase(fetchResponseRankExam.pending, (state, action) => {
        const userMessage = action.meta.arg?.userMessage
        if (userMessage) {
          state.messages.push({
            role: 'user',
            text: userMessage,
          })
        }
        state.exStatus = 'loading'
        state.error = null
      })
      .addCase(fetchResponseRankExam.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        const { answer, isFinished, user_transcript } = action.payload

        if (user_transcript) {
          state.userSpeech = user_transcript
          state.messages.push({
            role: 'user',
            text: user_transcript,
          })
        } else {
          state.userSpeech = ''
        }

        state.messages.push({
          role: 'assistant',
          text: answer,
        })

        state.aiStatus = isFinished ? 'finished' : 'idle'
      })
      .addCase(fetchResponseRankExam.rejected, (state, action) => {
        state.exStatus = 'idle'
        const lastMsg = state.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.messages.pop()
          state.userSpeech = ''
        }
        state.error = action.payload
      })

      // --- Вердикт ИИ-судьи ---
      .addCase(fetchFinishRankExam.pending, (state) => {
        state.exStatus = 'loading'
        state.error = null
      })
      .addCase(fetchFinishRankExam.fulfilled, (state, action) => {
        state.exStatus = 'succeeded'
        state.aiStatus = 'finished'
        state.passed = Boolean(action.payload?.passed)
        state.minScore = action.payload?.minScore ?? 80

        if (action.payload?.session?.result) {
          state.verdict = action.payload.session.result
        }
      })
      .addCase(fetchFinishRankExam.rejected, (state, action) => {
        state.exStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { setRankExamAiStatus, resetRankExamState } =
  rankExamSlice.actions
export {
  fetchStartRankExam,
  fetchResponseRankExam,
  fetchFinishRankExam,
}
export default rankExamSlice.reducer
