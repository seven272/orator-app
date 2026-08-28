import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import axiosInstance from '../../utils/axiosInstance'

// УПРАЖНЕНИЕ ДЕБАТЫ
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
  async ({ topic, position, userMessage }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/response-debate', {
        topic,
        position,
        userMessage,
      })
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

// УПРАЖНЕНИЕ ИНТЕРВЬЮ
const fetchStartInterview = createAsyncThunk(
  'aiExercise/fetchStartInerview',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-interview', {
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

const fetchResponseInterview = createAsyncThunk(
  'aiExercise/fetchResponseInterview',
  async ({ interviewData, userMessage }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/response-interview', {
        interviewData,
        userMessage,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при проведении интервью'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishInterview = createAsyncThunk(
  'aiExercise/fetchFinishInterview',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-interview', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении интервью'
      return rejectWithValue(errorMsg)
    }
  },
)

// УПРАЖНЕНИЕ ЛЕДОКОЛ
const fetchStartIcebreaker = createAsyncThunk(
  'aiExercise/fetchStartIcebreaker',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-icebreaker', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте Ледакола'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseIcebreaker = createAsyncThunk(
  'aiExercise/fetchResponseIcebreaker',
  async ({ scenarioData, userMessage }, { rejectWithValue }) => {
    // const userId = '66778899aabbccddeeff0011'
    try {
      const res = await axiosInstance.post(
        '/ai/response-icebreaker',
        {
          scenarioData,
          userMessage,
        },
      )

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при проведении интервью'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchFinishIcebreaker = createAsyncThunk(
  'aiExercise/fetchFinishIcebreaker',
  async ({ isDaily }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/finish-icebreaker', {
        isDaily,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении Ледокола'
      return rejectWithValue(errorMsg)
    }
  },
)

// УПРАЖНЕНИЕ ТРИБУНА
const fetchStartTribune = createAsyncThunk(
  'aiExercise/fetchStartTribune',
  async (exerciseData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/start-tribune', {
        exerciseData,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте упражнения Трибуна'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchResponseTribune = createAsyncThunk(
  'aiExercise/fetchResponseTribune',
  async ({ scenarioData, userMessage }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/ai/response-tribune', {
        scenarioData,
        userMessage,
      })

      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при ответе пользователю в упражнении Трибуна'
      return rejectWithValue(errorMsg)
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
      console.log(error)
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при завершении упражнения трибуна'
      return rejectWithValue(errorMsg)
    }
  },
)

// Хелперы для чистоты
const setPending = (state, exerciseName) => {
  state.globalStatus = 'loading'
  state.exercises[exerciseName].exStatus = 'loading'
  state.exercises[exerciseName].error = null
}

const setRejected = (state, action, exerciseName) => {
  state.globalStatus = 'failed'
  state.globalError = action.payload
  state.exercises[exerciseName].exStatus = 'failed'
  state.exercises[exerciseName].error = action.payload
}

const initialState = {
  activeExercise: '', // Текущее активное упражнение: 'debate', 'interview' и т.д.
  exercises: {
    debate: {
      messages: [], // История сообщений { role: 'assistant' | 'user', text: string }
      exStatus: 'idle', // idle | loading | succeeded | failed
      aiStatus: 'idle', // idle | recording | processing | ai_thinking | finished
      verdict: null, // { totalScore, feedback, criteria }
      error: null, // Текст ошибки, если есть
    },
    interview: {
      messages: [],
      exStatus: 'idle',
      aiStatus: 'idle',
      verdict: null,
      error: null,
    },
    icebreaker: {
      messages: [],
      warmth: 0, // Шкала прогресса тепла (0-100)
      exStatus: 'idle',
      aiStatus: 'idle',
      verdict: null,
      error: null,
    },
    tribune: {
      messages: [],
      exStatus: 'idle',
      aiStatus: 'idle',
      verdict: null,
      error: null,
    },
  },
  globalStatus: 'idle', // Общий статус для отслеживания глобальных ошибок
  globalError: null,
}

const aiExerciseSlice = createSlice({
  name: 'aiExercise',
  initialState,
  reducers: {
    setActiveExercise: (state, action) => {
      state.activeExercise = action.payload
    },
    setAiStatus: (state, action) => {
      console.log(action.payload)
      state.exercises[state.activeExercise].aiStatus = action.payload
    },
    // Сброс состояния конкретного упражнения (вызывается при закрытии или смене темы)
    resetExerciseState: (state, action) => {
      const exerciseName = action.payload
      if (state.exercises[exerciseName]) {
        state.exercises[exerciseName] = {
          messages: [],
          exStatus: 'idle',
          aiStatus: 'idle',
          verdict: null,
          error: null,
        }
        // Дополнительный сброс шкалы warmth для Ледокола
        if (exerciseName === 'icebreaker') {
          state.exercises.icebreaker.warmth = 0
        }
        if (state.activeExercise === exerciseName) {
          state.activeExercise = ''
        }
      }
    },
    // Ручное добавление сообщения (например, системного)
    addMessageToExercise: (state, action) => {
      const { exerciseName, message } = action.payload
      if (state.exercises[exerciseName]) {
        state.exercises[exerciseName].messages.push(message)
      }
    },
  },
  extraReducers: (builder) => {
    // --- Логика для упражнения DEBATE ---
    // *Запрос на старт дебатов*
    builder
      .addCase(fetchStartDebate.pending, (state) => {
        state.activeExercise = 'debate'
        setPending(state, 'debate')
      })
      .addCase(fetchStartDebate.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.debate.exStatus = 'succeeded'
        // Очищаем историю и добавляем первое сообщение от ИИ
        state.exercises.debate.messages = []
        state.exercises.debate.messages.push({
          role: 'assistant',
          text: action.payload.answer,
        })
      })
      .addCase(fetchStartDebate.rejected, (state, action) => {
        setRejected(state, action, 'debate')
      })
      // *Запрос на ответ пользователя дебаты*
      .addCase(
        fetchSendUserResponseDebate.pending,
        (state, action) => {
          //в пендинг классическая запись action payload не работает,  сообщение хранится в action.meta.arg
          const userMessage = action.meta.arg.userMessage
          // Добавляем сообщение пользователя СРАЗУ для отзывчивости UI.
          // Если запрос упадет, мы удалим его в .rejected.
          state.exercises.debate.messages.push({
            role: 'user',
            text: userMessage,
          })
          setPending(state, 'debate')
        },
      )
      .addCase(
        fetchSendUserResponseDebate.fulfilled,
        (state, action) => {
          state.globalStatus = 'succeeded'
          state.exercises.debate.exStatus = 'succeeded'
          // ЕСЛИ это был 3-й ответ пользователя — не добавляем ответ ИИ и финализируем
          if (action.payload.isDebateFinished === true) {
            state.exercises.debate.aiStatus = 'finished'
            // (Опционально) Здесь можно сразу вызвать экшен для получения оценки от ИИ-судьи
          } else {
            // ЕСЛИ раунды еще есть — добавляем ответ ИИ-оппонента
            const aiMessage = {
              role: 'assistant',
              text: action.payload.answer,
            }
            state.exercises.debate.messages.push(aiMessage)
            state.exercises.debate.aiStatus = 'idle' // Возвращаем в ожидание новой записи
          }
        },
      )
      .addCase(
        fetchSendUserResponseDebate.rejected,
        (state, action) => {
          state.globalStatus = 'failed'
          state.exercises.debate.exStatus = 'failed'
          // Удаляем последнее сообщение пользователя, так как ответ от ИИ не пришел. at это новый метод работы с массивами в js который возвращает элемент по индексу (-1 последний индекс)
          const lastMsg = state.exercises.debate.messages.at(-1)
          if (lastMsg && lastMsg.role === 'user') {
            state.exercises.debate.messages.pop()
            // Сохраняем текст ошибки для отображения в UI
            state.exercises.debate.error = action.payload
            // Можно добавить системное сообщение об ошибке:
            // state.exercises.debate.messages.push({ role: 'system', text: action.payload });
            // Возвращаем статус в idle, чтобы можно было попробовать снова
            state.exercises.debate.exStatus = 'idle'
          }
        },
      )
      //оценка ии за дебаты
      .addCase(fetchFinishDebate.pending, (state) => {
        setPending(state, 'debate')
      })
      .addCase(fetchFinishDebate.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.debate.exStatus = 'succeeded'
        // Записываем данные из БД (модель AiExercise) в стейт
        if (action.payload?.session?.result) {
          state.exercises.debate.verdict =
            action.payload.session.result
        }
      })
      .addCase(fetchFinishDebate.rejected, (state, action) => {
        setRejected(state, action, 'debate')
      })

    // --- Логика для упражнения INTERVIEW ---

    builder
      // *Запрос на старт интервью*
      .addCase(fetchStartInterview.pending, (state) => {
        state.activeExercise = 'interview'
        setPending(state, 'interview')
      })
      .addCase(fetchStartInterview.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.interview.exStatus = 'succeeded'
        // Очищаем историю и добавляем первое сообщение от ИИ
        state.exercises.interview.messages = []

        state.exercises.interview.messages.push({
          role: 'assistant',
          text: action.payload.preview,
        })
        state.exercises.interview.messages.push({
          role: 'assistant',
          text: action.payload.question,
        })
      })
      .addCase(fetchStartInterview.rejected, (state, action) => {
        setRejected(state, action, 'interview')
      })
      // *Запрос на ответ пользователя Интерью*
      .addCase(fetchResponseInterview.pending, (state, action) => {
        //в пендинг классическая запись action payload не работает,  сообщение хранится в action.meta.arg
        const userMessage = action.meta.arg.userMessage
        // Добавляем сообщение пользователя СРАЗУ для отзывчивости UI.
        // Если запрос упадет, мы удалим его в .rejected.
        state.exercises.interview.messages.push({
          role: 'user',
          text: userMessage,
        })
        setPending(state, 'interview')
      })
      .addCase(fetchResponseInterview.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.interview.exStatus = 'succeeded'
        // ЕСЛИ это был последний ответ пользователя — не добавляем ответ ИИ и финализируем
        if (action.payload.isInterviewFinished === true) {
          state.exercises.interview.aiStatus = 'finished'
        } else {
          // ЕСЛИ раунды еще есть — добавляем ответ ИИ-оппонента
          const aiMessage = {
            role: 'assistant',
            text: action.payload.answer,
          }
          state.exercises.interview.messages.push(aiMessage)
          state.exercises.interview.aiStatus = 'idle' // Возвращаем в ожидание новой записи
        }
      })
      .addCase(fetchResponseInterview.rejected, (state, action) => {
        state.globalStatus = 'failed'
        state.exercises.interview.exStatus = 'failed'
        // Удаляем последнее сообщение пользователя, так как ответ от ИИ не пришел. at это новый метод работы с массивами в js который возвращает элемент по индексу (-1 последний индекс)
        const lastMsg = state.exercises.interview.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.exercises.interview.messages.pop()
          // Сохраняем текст ошибки для отображения в UI
          state.exercises.interview.error = action.payload
          // Возвращаем статус в idle, чтобы можно было попробовать снова
          state.exercises.interview.exStatus = 'idle'
        }
      })
      //оценка ии за интервью
      .addCase(fetchFinishInterview.pending, (state) => {
        setPending(state, 'interview')
      })
      .addCase(fetchFinishInterview.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.interview.exStatus = 'succeeded'
        state.exercises.interview.aiStatus = 'finished'

        if (action.payload?.session?.result) {
          state.exercises.interview.verdict =
            action.payload.session.result
        }
      })
      .addCase(fetchFinishInterview.rejected, (state, action) => {
        setRejected(state, action, 'interview')
      })
      // *Запрос на старт Ледокола*
      .addCase(fetchStartIcebreaker.pending, (state) => {
        state.activeExercise = 'icebreaker'
        setPending(state, 'icebreaker')
      })
      .addCase(fetchStartIcebreaker.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.icebreaker.exStatus = 'succeeded'
        // Очищаем историю и добавляем первое сообщение от ИИ
        state.exercises.icebreaker.messages = []
        state.exercises.icebreaker.warmth = 0

        state.exercises.icebreaker.messages.push({
          role: 'assistant',
          text: action.payload.preview,
        })
        state.exercises.icebreaker.messages.push({
          role: 'assistant',
          text: action.payload.question,
        })
      })
      .addCase(fetchStartIcebreaker.rejected, (state, action) => {
        setRejected(state, action, 'icebreaker')
      })
      // *Запрос на ответ пользователя Ледокол*
      .addCase(fetchResponseIcebreaker.pending, (state, action) => {
        //в пендинг классическая запись action payload не работает,  сообщение хранится в action.meta.arg
        const userMessage = action.meta.arg.userMessage
        // Добавляем сообщение пользователя СРАЗУ для отзывчивости UI.
        // Если запрос упадет, мы удалим его в .rejected.
        state.exercises.icebreaker.messages.push({
          role: 'user',
          text: userMessage,
        })
        setPending(state, 'icebreaker')
      })
      .addCase(fetchResponseIcebreaker.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        const { answer, warmth, isFinished } = action.payload
        const icebreaker = state.exercises.icebreaker
        icebreaker.exStatus = 'succeeded'
        icebreaker.warmth = warmth
        // Если диалог завершен по лимиту ходов или успеху
        // ЕСЛИ это был последний ответ пользователя — не добавляем ответ ИИ и финализируем
        if (isFinished) {
          icebreaker.aiStatus = 'finished'
        } else {
          // Если раунды еще есть — добавляем ответ ИИ-собеседника
          icebreaker.messages.push({
            role: 'assistant',
            text: answer,
          })
          icebreaker.aiStatus = 'idle' // Возвращаем в ожидание новой реплики
        }
      })
      .addCase(fetchResponseIcebreaker.rejected, (state, action) => {
        state.globalStatus = 'failed'
        state.exercises.icebreaker.exStatus = 'idle' // возвращаем в idle, чтобы кнопка записи разблокировалась

        // Удаляем последнее сообщение пользователя, так как ответ ИИ не сгенерировался
        const lastMsg = state.exercises.icebreaker.messages.at(-1)
        if (lastMsg && lastMsg.role === 'user') {
          state.exercises.icebreaker.messages.pop()
        }
        state.exercises.icebreaker.error = action.payload
      })
      //оценка ии за Ледокол
      .addCase(fetchFinishIcebreaker.pending, (state) => {
        setPending(state, 'icebreaker')
      })
      .addCase(fetchFinishIcebreaker.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.icebreaker.exStatus = 'succeeded'
        state.exercises.icebreaker.aiStatus = 'finished'

        // Забираем вердикт строго из вложенной сессии согласно структуре бэкенда
        if (action.payload?.session?.result) {
          state.exercises.icebreaker.verdict =
            action.payload.session.result
        }
      })
      .addCase(fetchFinishIcebreaker.rejected, (state, action) => {
        setRejected(state, action, 'icebreaker')
      })
      // *Запрос на старт Трибуна*
      .addCase(fetchStartTribune.pending, (state) => {
        state.activeExercise = 'tribune'
        setPending(state, 'tribune')
      })
      .addCase(fetchStartTribune.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        state.exercises.tribune.exStatus = 'succeeded'
        // Очищаем историю и добавляем первое сообщение от ИИ
        state.exercises.tribune.messages = []

        state.exercises.tribune.messages.push({
          role: 'assistant',
          text: action.payload.preview,
        })
      })
      .addCase(fetchStartTribune.rejected, (state, action) => {
        setRejected(state, action, 'tribune')
      })
      // *Запрос на ответ пользователя Трибуна*
      .addCase(fetchResponseTribune.pending, (state, action) => {
        //в пендинг классическая запись action payload не работает,  сообщение хранится в action.meta.arg
        const userMessage = action.meta.arg.userMessage
        // Добавляем сообщение пользователя СРАЗУ для отзывчивости UI.
        // Если запрос упадет, мы удалим его в .rejected.
        state.exercises.tribune.messages.push({
          role: 'user',
          text: userMessage,
        })
        setPending(state, 'tribune')
      })
      .addCase(fetchResponseTribune.fulfilled, (state, action) => {
        state.globalStatus = 'succeeded'
        const { answer, isFinished } = action.payload
        const tribune = state.exercises.tribune
        tribune.exStatus = 'succeeded'
        console.log(action.payload)
        if (isFinished) {
          const aiMessage = {
            role: 'assistant',
            text: answer,
          }
          tribune.messages.push(aiMessage)
          tribune.aiStatus = 'finished'
        } else {
          const aiMessage = {
            role: 'assistant',
            text: answer,
          }
          tribune.messages.push(aiMessage)
          tribune.aiStatus = 'idle'
        }
      })
      .addCase(fetchResponseTribune.rejected, (state, action) => {
        setRejected(state, action, 'tribune')
      })
      //вердикт ии за Трибуна
      .addCase(fetchFinishTribune.pending, (state) => {
        setPending(state, 'tribune')
      })
      .addCase(fetchFinishTribune.fulfilled, (state, action) => {
        state.exercises.tribune.exStatus = 'succeeded'

        if (action.payload?.session?.result) {
          state.exercises.tribune.verdict =
            action.payload.session.result
        }
      })
      .addCase(fetchFinishTribune.rejected, (state, action) => {
        setRejected(state, action, 'tribune')
      })
  },
})

export const {
  setActiveExercise,
  resetExerciseState,
  addMessageToExercise,
  setAiStatus,
} = aiExerciseSlice.actions
export {
  fetchStartDebate,
  fetchSendUserResponseDebate,
  fetchFinishDebate,
  fetchStartInterview,
  fetchResponseInterview,
  fetchFinishInterview,
  fetchStartIcebreaker,
  fetchResponseIcebreaker,
  fetchFinishIcebreaker,
  fetchStartTribune,
  fetchResponseTribune,
  fetchFinishTribune,
}
export default aiExerciseSlice.reducer
