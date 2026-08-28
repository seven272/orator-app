import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

// --- АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS) ---

// Создание комнаты (Поиск, Ссылка, Календарь)
const fetchCreateLiveRoom = createAsyncThunk(
  'liveDuel/fetchCreateLiveRoom',
  async (roomPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live/create-room', {
        creationType: roomPayload.creationType,
        scheduledAt: roomPayload.scheduledAt,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при создании комнаты',
      )
    }
  },
)

// Подключение к комнате (Поиск пары или по ссылке)
const fetchJoinLiveRoom = createAsyncThunk(
  'liveDuel/fetchJoinLiveRoom',
  async (joinPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live/join-room', {
        inviteToken: joinPayload?.inviteToken,
        roomId: joinPayload?.roomId,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при подключении к комнате',
      )
    }
  },
)
// Проверка текущего статуса комнаты (пуллинг)
const fetchCheckRoomStatus = createAsyncThunk(
  'liveDuel/fetchCheckRoomStatus',
  async ({ roomId }, { rejectWithValue }) => {
    try {
      // Меняем эндпоинт на чистую проверку статуса
      const res = await axiosInstance.post('/live/check-status', {
        roomId: roomId,
      })
      return res.data // Придет { success: true, room: { status: 'active'/... } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка проверки статуса',
      )
    }
  },
)

// Сохранение рейтинга / завершение дуэли
const fetchSubmitLiveRating = createAsyncThunk(
  'liveDuel/fetchSubmitLiveRating',
  async ({ roomId, rating }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live/submit-rating', {
        roomId: roomId,
        rating: rating,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при сохранении рейтинга',
      )
    }
  },
)

// Получение общего календаря дуэлей
const fetchGetCalendarRooms = createAsyncThunk(
  'liveDuel/fetchGetCalendarRooms',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/live/calendar-rooms')
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки календаря',
      )
    }
  },
)

// Получить личные активные слоты
const fetchGetMyActiveSlots = createAsyncThunk(
  'liveDuel/fetchGetMyActiveSlots',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/live/my-slots')
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка загрузки ваших слотов',
      )
    }
  },
)

// Обновить дату/время слота
const fetchUpdateLiveRoomDate = createAsyncThunk(
  'liveDuel/fetchUpdateLiveRoomDate',
  async ({ roomId, scheduledAt }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put('/live/update-slot', {
        roomId: roomId,
        scheduledAt: scheduledAt,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка изменения даты слота',
      )
    }
  },
)

// Удалить слот
const fetchDeleteLiveRoom = createAsyncThunk(
  'liveDuel/fetchDeleteLiveRoom',
  async ({ roomId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.delete(
        `/live/delete-slot/${roomId}`,
      )
      return { roomId, ...res.data }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка при удалении слота',
      )
    }
  },
)

// Проверка валидности комнаты по инвайт-токену из ссылки
const fetchCheckInviteToken = createAsyncThunk(
  'liveDuel/fetchCheckInviteToken',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/live/check-invite/${token}`,
      )
      return res.data // вернет { success: true, room }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ссылка недействительна или устарела',
      )
    }
  },
)
// Проверка выставления оценок после дуэли
const fetchCheckRatingStatus = createAsyncThunk(
  'liveDuel/fetchCheckRatingStatus',
  async (roomId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/live/rating-status/${roomId}`,
      )
      return res.data // Возвращает { success: true, data: { yourRatingToOpponent, opponentRatingToYou, isAiBot } }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при проверке статуса оценок',
      )
    }
  },
)
// статистика по дуэлям
const fetchLiveDuelStats = createAsyncThunk(
  'liveDuel/fetchLiveDuelStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/live/dashboard-stats')
      console.log('Ответ сервера для дуэлей:', res.data)
      console.log(res.data.data)
      return res.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка загрузки статистики дуэлей',
      )
    }
  },
)

// Фолбэк на ИИ-бота при тайм-ауте
const fetchStartLiveDuelAiBot = createAsyncThunk(
  'liveDuel/fetchStartLiveDuelAiBot',
  async (roomPayload, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/live/start-ai', {
        roomId: roomPayload.roomId,
      })
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при подключении ИИ-бота',
      )
    }
  },
)
 const fetchSendLiveDuelMessageAiBot = createAsyncThunk(
  'liveDuel/fetchSendLiveDuelMessageAiBot',
  async ({ roomId, audioBlob }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append('roomId', roomId)
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'speech.wav') // Передаем эталонный WAV-файл
      }

      const response = await axiosInstance.post('/live/send-ai-message', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data // Возвращает { success: true, userText: '...', answer: '...', isFinished: true/false }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка сервера при отправке аудиозаписи',
      )
    }
  }
)

// --- Завершение дуэли и получение вердикта ИИ-судьи ---
 const fetchFinishLiveDuelAiBot = createAsyncThunk(
  'liveDuel/fetchFinishLiveDuelAiBot',
  async ({ roomId }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/live/finish-ai', {
        roomId,
      })
      return response.data // Возвращает { success: true, evaluation: {...}, earnedXp: 250, ... }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка при получении оценки ИИ-судьи',
      )
    }
  }
)

// --- СЛАЙС ---

const initialState = {
  currentRoom: null,
  calendarRooms: [],
  myActiveSlots: [],
  aiGreeting: '',
  searchStatus: 'idle', // Статусы: 'idle' | 'searching' | 'link_waiting' | 'active' | 'failed' | 'slot_create' | 'slots_list'
  opponentRating: null, // Оценка, которую поставил нам оппонент
  isRatingSubmitted: false, // Флаг, что ТЕКУЩИЙ пользователь отправил оценку (или нажал Пропустить)
  loading: false,
  error: null,
  duelStats: {
    averageRating: 5.0,
    totalRooms: 0,
    feedbackRate: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    history: [],
  },
  statsLoading: false,
  statsError: null,
}

const liveDuelSlice = createSlice({
  name: 'liveDuel',
  initialState,
  reducers: {
    resetLiveDuelState: (state) => {
      state.currentRoom = null
      state.calendarRooms = []
      state.myActiveSlots = []
      state.aiGreeting = ''
      state.searchStatus = 'idle'
      state.opponentRating = null
      state.isRatingSubmitted = false
      state.loading = false
      state.error = null
      state.duelStats = {
        averageRating: 5.0,
        totalRooms: 0,
        feedbackRate: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        history: [],
      }
      state.statsLoading = false
      state.statsError = null
    },
    setSearchStatus: (state, action) => {
      state.searchStatus = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Создание комнаты ---
      .addCase(fetchCreateLiveRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCreateLiveRoom.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room

        const creationType = action.payload.room?.creationType
        if (creationType === 'quick_search') {
          state.searchStatus = 'searching'
        } else if (creationType === 'direct_link') {
          state.searchStatus = 'link_waiting'
        } else if (creationType === 'calendar') {
          state.searchStatus = 'idle'
        }
      })
      .addCase(fetchCreateLiveRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- Подключение к комнате ---
      .addCase(fetchJoinLiveRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchJoinLiveRoom.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room

        if (action.payload.room) {
          state.searchStatus = 'active'
        } else {
          state.searchStatus = 'searching'
        }
      })
      .addCase(fetchJoinLiveRoom.rejected, (state, action) => {
        state.loading = false
        state.searchStatus = 'failed'
        state.error = action.payload
      })
      // --- Проверка статуса комнаты (Пуллинг) ---
      .addCase(fetchCheckRoomStatus.pending, (state) => {
        state.error = null
      })
      .addCase(fetchCheckRoomStatus.fulfilled, (state, action) => {
        const incomingRoom = action.payload?.room

        if (incomingRoom) {
          if (incomingRoom.status === 'active') {
            state.currentRoom = incomingRoom
            state.searchStatus = 'active'
          }
        } else {
          console.warn('=== REDUX: В ОТВЕТЕ НЕТ ОБЪЕКТА room! ===')
        }
      })
      .addCase(fetchCheckRoomStatus.rejected, (state, action) => {
        state.error = action.payload
        state.loading = false
      })

      // --- Отправка рейтинга дуэли ---
      .addCase(fetchSubmitLiveRating.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSubmitLiveRating.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room
        state.isRatingSubmitted = true
      })
      .addCase(fetchSubmitLiveRating.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // --- Проверка статуса оценок (Пуллинг) ---
      .addCase(fetchCheckRatingStatus.fulfilled, (state, action) => {
        // Записываем оценку от оппонента из пришедшего data
        state.opponentRating = action.payload.data.opponentRatingToYou
      })
      // --- Получение календаря дуэлей ---
      .addCase(fetchGetCalendarRooms.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGetCalendarRooms.fulfilled, (state, action) => {
        state.loading = false
        state.calendarRooms = action.payload.rooms
      })
      .addCase(fetchGetCalendarRooms.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- Получение личных слотов ---
      .addCase(fetchGetMyActiveSlots.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGetMyActiveSlots.fulfilled, (state, action) => {
        state.loading = false
        state.myActiveSlots = action.payload.rooms
      })
      .addCase(fetchGetMyActiveSlots.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- Обновление даты слота ---
      .addCase(fetchUpdateLiveRoomDate.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUpdateLiveRoomDate.fulfilled, (state, action) => {
        state.loading = false
        const index = state.myActiveSlots.findIndex(
          (room) => room._id === action.payload.room._id,
        )
        if (index !== -1) {
          state.myActiveSlots[index] = action.payload.room
        }
      })
      .addCase(fetchUpdateLiveRoomDate.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- Удаление слота ---
      .addCase(fetchDeleteLiveRoom.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDeleteLiveRoom.fulfilled, (state, action) => {
        state.loading = false
        state.myActiveSlots = state.myActiveSlots.filter(
          (room) => room._id !== action.payload.roomId,
        )
      })
      .addCase(fetchDeleteLiveRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- Проверка инвайт-токена (Вход по ссылке) ---
      .addCase(fetchCheckInviteToken.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCheckInviteToken.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room
      })
      .addCase(fetchCheckInviteToken.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // --- ПОЛУЧЕНИЕ СТАТИСТИКИ ДУЭЛЕЙ ---
      .addCase(fetchLiveDuelStats.pending, (state) => {
        state.statsLoading = true
        state.statsError = null
      })
      .addCase(fetchLiveDuelStats.fulfilled, (state, action) => {
        state.statsLoading = false
        state.duelStats = action.payload
      })
      .addCase(fetchLiveDuelStats.rejected, (state, action) => {
        state.statsLoading = false
        state.statsError = action.payload
      })
         // --- Переключение на ИИ-бота ---
      .addCase(fetchStartLiveDuelAiBot.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStartLiveDuelAiBot.fulfilled, (state, action) => {
        state.loading = false
        state.currentRoom = action.payload.room
        state.aiGreeting = action.payload.aiGreeting
        state.searchStatus = 'active'
      })
      .addCase(fetchStartLiveDuelAiBot.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // --- отправка сообщений ии боты ---
      .addCase(fetchSendLiveDuelMessageAiBot.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchSendLiveDuelMessageAiBot.fulfilled, (state, action) => {
        state.loading = false
        // Здесь мы не перезаписываем всю комнату, так как бэкенд возвращает только точечные данные (answer, isFinished).
        // Добавление сообщений в массив чата мы сделаем прямо в UI-компоненте или через локальный стейт, 
        // чтобы сохранить плавность интерфейса. При необходимости можно обновить свойства в currentRoom.
      })
      .addCase(fetchSendLiveDuelMessageAiBot.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
       // --- Финализация и судейство ИИ ---
       .addCase(fetchFinishLiveDuelAiBot.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFinishLiveDuelAiBot.fulfilled, (state, action) => {
        state.loading = false
        // Переводим статус комнаты в выполненный в глобальном стейте
        if (state.currentRoom) {
          state.currentRoom.status = 'completed'
        }
     
      })
      .addCase(fetchFinishLiveDuelAiBot.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })


  },
})

export const { resetLiveDuelState, setSearchStatus } =
  liveDuelSlice.actions
export {
  fetchCreateLiveRoom,
  fetchJoinLiveRoom,
  fetchCheckRoomStatus,
  fetchSubmitLiveRating,
  fetchGetCalendarRooms,
  fetchGetMyActiveSlots,
  fetchDeleteLiveRoom,
  fetchUpdateLiveRoomDate,
  fetchCheckInviteToken,
  fetchCheckRatingStatus,
  fetchLiveDuelStats,
  fetchStartLiveDuelAiBot,
  fetchSendLiveDuelMessageAiBot,
  fetchFinishLiveDuelAiBot
}
export default liveDuelSlice.reducer
