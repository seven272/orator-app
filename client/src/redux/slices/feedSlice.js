import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// 1. Thunk для получения последних событий сообщества («Пульс»)
const fetchFeedEvents = createAsyncThunk(
  'feed/fetchFeedEvents',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/feed/all');
      return res.data.data; // Получаем массив отформатированных событий из ответа бэкенда
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Не удалось загрузить ленту событий',
      );
    }
  },
);

// 2. Thunk для отправки реакции (огонька/поздравления) событию
const fetchSendCongratulation = createAsyncThunk(
  'feed/fetchSendCongratulation',
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(`/feed/congratulate/${eventId}`);
      // Возвращаем ID события и новые данные счетчиков с бэка
      return { 
        eventId, 
        congratulationsCount: res.data.congratulationsCount,
        isCongratulatedByMe: res.data.isCongratulatedByMe 
      };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Не удалось отправить реакцию',
      );
    }
  },
);

const feedSlice = createSlice({
  name: 'feed',
  initialState: {
    events: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    // Сброс состояния при размонтировании компонента для предотвращения утечек памяти
    resetFeedState: (state) => {
      state.events = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- Загрузка ленты событий ---
      .addCase(fetchFeedEvents.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFeedEvents.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.events = action.payload;
      })
      .addCase(fetchFeedEvents.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      // --- Отправка поздравления/реакции ---
      .addCase(fetchSendCongratulation.fulfilled, (state, action) => {
        const { eventId, congratulationsCount, isCongratulatedByMe } = action.payload;
        // Находим событие в локальном массиве и мгновенно обновляем его состояние в UI
        const targetEvent = state.events.find((ev) => ev.id === eventId);
        if (targetEvent) {
          targetEvent.congratulationsCount = congratulationsCount;
          targetEvent.isCongratulatedByMe = isCongratulatedByMe;
        }
      });
  },
});

export const { resetFeedState } = feedSlice.actions;
export {fetchFeedEvents, fetchSendCongratulation}
export default feedSlice.reducer;
