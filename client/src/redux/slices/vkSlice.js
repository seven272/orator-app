import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { fetchVkAuth } from './authSlice';
import axiosInstance from '../../utils/axiosInstance' 

// 1. Экшен начисления наград за выполнение ВК-заданий
const fetchClaimVkBonus = createAsyncThunk(
  'vk/fetchClaimVkBonus',
  async ({ taskType }, { rejectWithValue }) => {
    try {
      // Запрос идет на новый защищенный роут подписи ВК
      const response = await axiosInstance.post('/api/vk/claim-bonus', { taskType });
      return response.data; // Возвращает { message, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось начислить награду'
      );
    }
  }
);

// 2. Экшен тихого обновления таймера кулдауна модального окна (1 раз в 3 дня)
const fetchUpdateViralModalTimer = createAsyncThunk(
  'vk/fetchUpdateViralModalTimer',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/vk/update-modal-timer');
      return response.data; // Возвращает { message, lastViralModalShown }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось обновить таймер'
      );
    }
  }
);

const initialState = {
  isViralModalOpen: false,
  lastViralModalShown: null, // Перенесено из профиля в изолированный ВК-стейт
  viralBonusesClaimed: {
    favorites: false,
    homeScreen: false,
    notifications: false,
    communityJoin: false,
  },
  btnLoaders: {
    favorites: false,
    homeScreen: false,
    notifications: false,
    communityJoin: false,
  },
  status: 'idle',
  error: null,
};

const vkSlice = createSlice({
  name: 'vk',
  initialState,
  reducers: {
    openViralModal: (state) => {
      state.isViralModalOpen = true;
    },
    closeViralModal: (state) => {
      state.isViralModalOpen = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 🤖 ПЕРЕХВАТ АВТОРИЗАЦИИ: достаем глубокие служебные поля без перегрузки профиля
      .addCase(fetchVkAuth.fulfilled, (state, action) => {
        const rawUser = action.payload?.user; // Достаем объект целиком из ответа бэкенда
        const vkData = rawUser?.socialProfilesData?.vk;
        
        if (vkData) {
          if (vkData.viralBonusesClaimed) {
            state.viralBonusesClaimed = vkData.viralBonusesClaimed;
          }
          if (vkData.lastViralModalShown) {
            state.lastViralModalShown = vkData.lastViralModalShown;
          }
        }
      })

      // --- fetchClaimVkBonus ---
      .addCase(fetchClaimVkBonus.pending, (state, action) => {
        const { taskType } = action.meta.arg;
        if (state.btnLoaders[taskType] !== undefined) state.btnLoaders[taskType] = true;
        state.error = null;
      })
      .addCase(fetchClaimVkBonus.fulfilled, (state, action) => {
        const { taskType } = action.meta.arg;
        if (state.btnLoaders[taskType] !== undefined) state.btnLoaders[taskType] = false;
        
        // Мгновенно фиксируем выполнение таска локально в ВК-стейт
        state.viralBonusesClaimed[taskType] = true;
      })
      .addCase(fetchClaimVkBonus.rejected, (state, action) => {
        const { taskType } = action.meta.arg;
        if (state.btnLoaders[taskType] !== undefined) state.btnLoaders[taskType] = false;
        state.error = action.payload;
      })

      // --- fetchUpdateViralModalTimer ---
      .addCase(fetchUpdateViralModalTimer.fulfilled, (state, action) => {
        if (action.payload?.lastViralModalShown) {
          state.lastViralModalShown = action.payload.lastViralModalShown;
        }
      });
  },
});

export const { openViralModal, closeViralModal } = vkSlice.actions;
export {fetchClaimVkBonus, fetchUpdateViralModalTimer}
export default vkSlice.reducer;
