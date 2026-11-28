import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

// ==========================================
// 1. БАЗА ЗНАНИЙ: Thunks
// ==========================================

export const fetchGetKnowledgeList = createAsyncThunk(
  'educationHub/fetchGetKnowledgeList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/knowledge', { params })
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось загрузить Базу знаний'
      )
    }
  }
)

export const fetchGetKnowledgeBySlug = createAsyncThunk(
  'educationHub/fetchGetKnowledgeBySlug',
  async (slug, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/knowledge/${slug}`)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Материал не найден'
      )
    }
  }
)

export const fetchCreateKnowledgeItem = createAsyncThunk(
  'educationHub/fetchCreateKnowledgeItem',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/knowledge', payload)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось создать материал'
      )
    }
  }
)

export const fetchUpdateKnowledgeItem = createAsyncThunk(
  'educationHub/fetchUpdateKnowledgeItem',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/knowledge/${id}`, payload)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось обновить материал'
      )
    }
  }
)

export const fetchDeleteKnowledgeItem = createAsyncThunk(
  'educationHub/fetchDeleteKnowledgeItem',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/knowledge/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось удалить материал'
      )
    }
  }
)

// ==========================================
// 2. АФИША: Thunks
// ==========================================

export const fetchGetEventsList = createAsyncThunk(
  'educationHub/fetchGetEventsList',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get('/events', { params })
      return data.events || []
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось загрузить афишу'
      )
    }
  }
)

export const fetchGetEventById = createAsyncThunk(
  'educationHub/fetchGetEventById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/events/${id}`)
      return data.event
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Мероприятие не найдено'
      )
    }
  }
)

export const fetchRegisterForEvent = createAsyncThunk(
  'educationHub/fetchRegisterForEvent',
  async ({ eventId, isVk }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/events/${eventId}/register`, {
        isVk,
      })
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: 'Ошибка при оформлении участия' }
      )
    }
  }
)

export const fetchCreateEvent = createAsyncThunk(
  'educationHub/fetchCreateEvent',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/events', payload)
      return data.event
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось создать мероприятие'
      )
    }
  }
)

export const fetchUpdateEvent = createAsyncThunk(
  'educationHub/fetchUpdateEvent',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.put(`/events/${id}`, payload)
      return data.event
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось обновить мероприятие'
      )
    }
  }
)

export const fetchDeleteEvent = createAsyncThunk(
  'educationHub/fetchDeleteEvent',
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/events/${id}`)
      return id
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось удалить мероприятие'
      )
    }
  }
)

export const fetchGetEventParticipants = createAsyncThunk(
  'educationHub/fetchGetEventParticipants',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/events/${id}/participants`)
      return data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось загрузить участников'
      )
    }
  }
)
// ==========================================
// 3. SLICE & REDUCERS
// ==========================================

const initialState = {
  // База знаний
  knowledgeItems: [],
  currentKnowledgeItem: null,
  knowledgeFilters: {
    type: 'all', // 'all' | 'article' | 'video'
    skillTag: '',
  },

  // Афиша мероприятий
  events: [],
  currentEvent: null,
  eventParticipantsData: null,
  eventFilters: {
    format: 'all', // 'all' | 'online' | 'offline'
    city: '',
    onlyMy: false,
  },

  // Состояния загрузки
  isLoadingList: false,
  isLoadingDetail: false,
  isSubmitting: false,
  error: null,
}

const educationHubSlice = createSlice({
  name: 'educationHub',
  initialState,
  reducers: {
    setKnowledgeFilters: (state, action) => {
      state.knowledgeFilters = { ...state.knowledgeFilters, ...action.payload }
    },
    setEventFilters: (state, action) => {
      state.eventFilters = { ...state.eventFilters, ...action.payload }
    },
    clearCurrentKnowledgeItem: (state) => {
      state.currentKnowledgeItem = null
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null
    },
    clearEventParticipants: (state) => {
      state.eventParticipantsData = null
    },
  },
  extraReducers: (builder) => {
    builder
      // --- База знаний: Чтение ---
      .addCase(fetchGetKnowledgeList.pending, (state) => {
        state.isLoadingList = true
        state.error = null
      })
      .addCase(fetchGetKnowledgeList.fulfilled, (state, action) => {
        state.isLoadingList = false
        state.knowledgeItems = action.payload
      })
      .addCase(fetchGetKnowledgeList.rejected, (state, action) => {
        state.isLoadingList = false
        state.error = action.payload
      })
      .addCase(fetchGetKnowledgeBySlug.pending, (state) => {
        state.isLoadingDetail = true
        state.error = null
      })
      .addCase(fetchGetKnowledgeBySlug.fulfilled, (state, action) => {
        state.isLoadingDetail = false
        state.currentKnowledgeItem = action.payload
      })
      .addCase(fetchGetKnowledgeBySlug.rejected, (state, action) => {
        state.isLoadingDetail = false
        state.error = action.payload
      })

      // --- База знаний: CRUD ---
      .addCase(fetchCreateKnowledgeItem.pending, (state) => {
        state.isSubmitting = true
      })
      .addCase(fetchCreateKnowledgeItem.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.knowledgeItems.unshift(action.payload)
      })
      .addCase(fetchCreateKnowledgeItem.rejected, (state) => {
        state.isSubmitting = false
      })
      .addCase(fetchUpdateKnowledgeItem.pending, (state) => {
        state.isSubmitting = true
      })
      .addCase(fetchUpdateKnowledgeItem.fulfilled, (state, action) => {
        state.isSubmitting = false
        const index = state.knowledgeItems.findIndex(
          (item) => item._id === action.payload._id
        )
        if (index !== -1) {
          state.knowledgeItems[index] = action.payload
        }
        if (state.currentKnowledgeItem?._id === action.payload._id) {
          state.currentKnowledgeItem = action.payload
        }
      })
      .addCase(fetchUpdateKnowledgeItem.rejected, (state) => {
        state.isSubmitting = false
      })
      .addCase(fetchDeleteKnowledgeItem.fulfilled, (state, action) => {
        state.knowledgeItems = state.knowledgeItems.filter(
          (item) => item._id !== action.payload
        )
      })

      // --- Афиша: Чтение и регистрация ---
      .addCase(fetchGetEventsList.pending, (state) => {
        state.isLoadingList = true
        state.error = null
      })
      .addCase(fetchGetEventsList.fulfilled, (state, action) => {
        state.isLoadingList = false
        state.events = action.payload
      })
      .addCase(fetchGetEventsList.rejected, (state, action) => {
        state.isLoadingList = false
        state.error = action.payload
      })
      .addCase(fetchGetEventById.pending, (state) => {
        state.isLoadingDetail = true
        state.error = null
      })
      .addCase(fetchGetEventById.fulfilled, (state, action) => {
        state.isLoadingDetail = false
        state.currentEvent = action.payload
      })
      .addCase(fetchGetEventById.rejected, (state, action) => {
        state.isLoadingDetail = false
        state.error = action.payload
      })
      .addCase(fetchRegisterForEvent.pending, (state) => {
        state.isSubmitting = true
      })
      .addCase(fetchRegisterForEvent.fulfilled, (state) => {
        state.isSubmitting = false
      })
      .addCase(fetchRegisterForEvent.rejected, (state) => {
        state.isSubmitting = false
      })

      // --- Афиша: CRUD и участники ---
      .addCase(fetchCreateEvent.pending, (state) => {
        state.isSubmitting = true
      })
      .addCase(fetchCreateEvent.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.events.push(action.payload)
      })
      .addCase(fetchCreateEvent.rejected, (state) => {
        state.isSubmitting = false
      })
      .addCase(fetchUpdateEvent.pending, (state) => {
        state.isSubmitting = true
      })
      .addCase(fetchUpdateEvent.fulfilled, (state, action) => {
        state.isSubmitting = false
        const index = state.events.findIndex(
          (ev) => ev._id === action.payload._id
        )
        if (index !== -1) {
          state.events[index] = action.payload
        }
        if (state.currentEvent?._id === action.payload._id) {
          state.currentEvent = action.payload
        }
      })
      .addCase(fetchUpdateEvent.rejected, (state) => {
        state.isSubmitting = false
      })
      .addCase(fetchDeleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((ev) => ev._id !== action.payload)
      })
      .addCase(fetchGetEventParticipants.fulfilled, (state, action) => {
        state.eventParticipantsData = action.payload
      })
  },
})

export const {
  setKnowledgeFilters,
  setEventFilters,
  clearCurrentKnowledgeItem,
  clearCurrentEvent,
  clearEventParticipants,
} = educationHubSlice.actions

export default educationHubSlice.reducer
