import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

// --- АСИНХРОННЫЕ ЭКШЕНЫ (THUNKS) ---

// 🚀 НОВЫЙ ЭКШЕН: Отправка аудиосообщения (FormData: roomId + audio)
export const fetchSendAudioTrack = createAsyncThunk(
  'liveDuel/fetchSendAudioTrack',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/live-duel/upload-audio',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      return res.data // Придет { success: true, audioTracks: [...] }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при отправке аудиосообщения',
      )
    }
  },
)

// Создание комнаты (Только моментальный поиск или прямая ссылка)
export const fetchCreateLiveRoom = createAsyncThunk(
  'liveDuel/fetchCreateLiveRoom',
  async (roomPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live-duel/create-room', {
        creationType: roomPayload.creationType,
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
export const fetchJoinLiveRoom = createAsyncThunk(
  'liveDuel/fetchJoinLiveRoom',
  async (joinPayload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live-duel/join-room', {
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
export const fetchCheckRoomStatus = createAsyncThunk(
  'liveDuel/fetchCheckRoomStatus',
  async ({ roomId }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live-duel/check-status', {
        roomId: roomId,
      })
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка проверки статуса',
      )
    }
  },
)

// Сохранение рейтинга / завершение дуэли
export const fetchSubmitLiveRating = createAsyncThunk(
  'liveDuel/fetchSubmitLiveRating',
  async ({ roomId, rating }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/live-duel/submit-rating', {
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

// Проверка валидности комнаты по инвайт-токену из ссылки
export const fetchCheckInviteToken = createAsyncThunk(
  'liveDuel/fetchCheckInviteToken',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/live-duel/check-invite/${token}`,
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ссылка недействительна или устарела',
      )
    }
  },
)

// Проверка выставления оценок после дуэли
export const fetchCheckRatingStatus = createAsyncThunk(
  'liveDuel/fetchCheckRatingStatus',
  async (roomId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/live-duel/rating-status/${roomId}`,
      )
      return res.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при проверке статуса оценок',
      )
    }
  },
)

// Статистика по дуэлям
export const fetchLiveDuelStats = createAsyncThunk(
  'liveDuel/fetchLiveDuelStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/live-duel/dashboard-stats')
      return res.data.data // Возвращаем вложенную структуру данных строго по вашему коду
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка загрузки статистики дуэлей',
      )
    }
  },
)

// --- СЛАЙС ---

const initialState = {
  currentRoom: null,
  searchStatus: 'idle', // 'idle' | 'searching' | 'link_waiting' | 'active' | 'failed'
  opponentRating: null,
  isRatingSubmitted: false,
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
        }
      })
      .addCase(fetchCreateLiveRoom.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.searchStatus = 'failed'
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
      .addCase(fetchCheckRoomStatus.fulfilled, (state, action) => {
        const incomingRoom = action.payload?.room
        if (incomingRoom) {
          state.currentRoom = incomingRoom
          if (incomingRoom.status === 'active') {
            state.searchStatus = 'active'
          }
        }
      })
      .addCase(fetchCheckRoomStatus.rejected, (state, action) => {
        state.error = action.payload
      })

      // --- Отправка аудиосообщения ---
      .addCase(fetchSendAudioTrack.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchSendAudioTrack.fulfilled, (state, action) => {
        state.loading = false
        if (state.currentRoom && action.payload.audioTracks) {
          state.currentRoom.audioTracks = action.payload.audioTracks
        }
      })
      .addCase(fetchSendAudioTrack.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
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
        if (action.payload?.data) {
          state.opponentRating =
            action.payload.data.opponentRatingToYou
        }
      })

      // --- Загрузка статистики ---
      .addCase(fetchLiveDuelStats.pending, (state) => {
        state.statsLoading = true
        state.statsError = null
      })
      .addCase(fetchLiveDuelStats.fulfilled, (state, action) => {
        state.statsLoading = false
        if (action.payload) {
          state.duelStats = action.payload
        }
      })
      .addCase(fetchLiveDuelStats.rejected, (state, action) => {
        state.statsLoading = false
        state.statsError = action.payload
      })
  },
})

export const { resetLiveDuelState, setSearchStatus } =
  liveDuelSlice.actions
export default liveDuelSlice.reducer
