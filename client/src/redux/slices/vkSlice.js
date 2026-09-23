import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { fetchVkAuth } from './authSlice'
import axiosInstance from '../../utils/axiosInstance'

// 1. Экшен начисления наград за выполнение ВК-заданий
const fetchClaimVkBonus = createAsyncThunk(
  'vk/fetchClaimVkBonus',
  async ({ taskType, launchParams }, { rejectWithValue }) => {
    try {
      // Запрос идет на новый защищенный роут подписи ВК
      const response = await axiosInstance.post('/vk/claim-bonus', {
        taskType,
        launchParams,
      })

      return response.data // Возвращает { message, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Не удалось начислить награду',
      )
    }
  },
)

const initialState = {
  isViralModalOpen: false,
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
  isLevelUpModalOpen: false,
  levelUpData: {
    newLevel: 0,
    oldLevel: 0,
  },
  status: 'idle',
  error: null,
}

const vkSlice = createSlice({
  name: 'vk',
  initialState,
  reducers: {
    openViralModal: (state) => {
      state.isViralModalOpen = true
    },
    closeViralModal: (state) => {
      state.isViralModalOpen = false
      state.error = null
    },
    openLevelUpModal: (state, action) => {
      state.isLevelUpModalOpen = true
      state.levelUpData = action.payload // Прилетает { newLevel, oldLevel }
    },
    closeLevelUpModal: (state) => {
      state.isLevelUpModalOpen = false
      state.levelUpData = { newLevel: 0, oldLevel: 0 }
    },
  },
  extraReducers: (builder) => {
    builder
      //  ПЕРЕХВАТ АВТОРИЗАЦИИ: достаем глубокие служебные поля без перегрузки профиля
      .addCase(fetchVkAuth.fulfilled, (state, action) => {
        const rawUser = action.payload?.user // Достаем объект целиком из ответа бэкенда
        const vkData = rawUser?.socialProfilesData?.vk

        if (vkData) {
          if (vkData.viralBonusesClaimed) {
            state.viralBonusesClaimed = vkData.viralBonusesClaimed
          }
        }
      })

      // --- fetchClaimVkBonus ---
      .addCase(fetchClaimVkBonus.pending, (state, action) => {
        const { taskType } = action.meta.arg
        if (state.btnLoaders[taskType] !== undefined)
          state.btnLoaders[taskType] = true
        state.error = null
      })
      .addCase(fetchClaimVkBonus.fulfilled, (state, action) => {
        const { taskType } = action.meta.arg
        if (state.btnLoaders[taskType] !== undefined)
          state.btnLoaders[taskType] = false

        // Мгновенно фиксируем выполнение таска локально в ВК-стейт
        state.viralBonusesClaimed[taskType] = true
      })
      .addCase(fetchClaimVkBonus.rejected, (state, action) => {
        const { taskType } = action.meta.arg
        if (state.btnLoaders[taskType] !== undefined)
          state.btnLoaders[taskType] = false
        state.error = action.payload
      })
  },
})

export const {
  openViralModal,
  closeViralModal,
  openLevelUpModal,
  closeLevelUpModal,
} = vkSlice.actions
export { fetchClaimVkBonus }
export default vkSlice.reducer
