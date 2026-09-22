import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { syncGuestEnergy } from './profileSlice'
import { All_EXERCISES } from '../../assets/mocks/exercises'
import { getGuestEnergy, setGuestEnergy } from '../../utils/vk-utils/vkStorageEnergy'

// Экшен для отправки результата упражнения
const fetchCompleteExercise = createAsyncThunk(
  'exercise/complete',
  async (
    { exAlias, score, isDaily },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const res = await axiosInstance.post('/exercises/complete', {
        exAlias,
        score,
        isDaily,
      })

      // Списание энергии у неавторизованных гостей сайта / гостей ВК
      const { auth } = getState()
      const isGuestMode = !auth.user || auth.isVkGuest 

      if (isGuestMode) {
        const allExercisesFlat = Object.values(All_EXERCISES).flat()
        const curentEx = allExercisesFlat.find((ex) => ex.alias === exAlias)
        
        if (!curentEx) {
          console.error(`Тренажер ${exAlias} не найден для расчета стоимости энергии`);
          return res.data;
        }

        const cost = curentEx.level === 2 ? 2 : 1 // Уровень 2 стоит 2⚡, Уровень 1 стоит 1⚡
        
        // Определяем среду ВКонтакте по параметрам URL запуска [INDEX]
        const isVkEnv = window.location.search.includes('vk_user_id')
        let newEnergy = 0

        if (isVkEnv) {
          // 🌐 КЕЙС ВК: Работаем асинхронно с облачным хранилищем ВК Storage [INDEX]
          const currentGuestEnergy = await getGuestEnergy()
          newEnergy = Math.max(0, currentGuestEnergy - cost)
          await setGuestEnergy(newEnergy) // Записываем обратно в облако [INDEX]
        } else {
          // 💻 КЕЙС САЙТА: Работаем синхронно с классическим localStorage
          const currentGuestEnergy = localStorage.getItem('govorix_guest_energy')
            ? parseInt(localStorage.getItem('govorix_guest_energy'), 10)
            : 3
          newEnergy = Math.max(0, currentGuestEnergy - cost)
          localStorage.setItem('govorix_guest_energy', String(newEnergy))
        }

        // 🔥 Мгновенно пушим единственный финальный остаток в Редакс для реактивного UI! [INDEX]
        dispatch(syncGuestEnergy(newEnergy))
      }

      return res.data 
    } catch (error) {
      if (error.response?.data?.code === 'ENERGY_EXHAUSTED') {
        return rejectWithValue({
          code: 'ENERGY_EXHAUSTED',
          message: error.response.data.message,
        })
      }

      return rejectWithValue({
        code: 'SUBMIT_ERROR',
        message: error.response?.data?.message || 'Ошибка сохранения',
      })
    }
  },
)

const initialState = {
  activeExercise: '',
  lastResult: null,
  isSubmitting: false,
  error: null,
  isPremiumOfferOpen: false,
  isGuestOfferOpen: false,
}

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    clearLastResult: (state) => {
      state.lastResult = null
    },
    openPremiumOffer: (state) => {
      state.isPremiumOfferOpen = true
    },
    closePremiumOffer: (state) => {
      state.isPremiumOfferOpen = false
    },
    openGuestOffer: (state) => {
      state.isGuestOfferOpen = true
    },
    closeGuestOffer: (state) => {
      state.isGuestOfferOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompleteExercise.pending, (state) => {
        state.isSubmitting = true
        state.error = null
      })
      .addCase(fetchCompleteExercise.fulfilled, (state, action) => {
        state.isSubmitting = false
        state.lastResult = action.payload // Сюда прилетят геймификация и новый dailyEnergy
      })
      .addCase(fetchCompleteExercise.rejected, (state, action) => {
        state.isSubmitting = false

        // 🔥 Проверяем, если лимит энергии исчерпан — открываем модалку-оффер Premium
        if (action.payload?.code === 'ENERGY_EXHAUSTED') {
          state.isPremiumOfferOpen = true
          state.error = action.payload.message
        } else {
          state.error = action.payload?.message || 'Ошибка сохранения'
        }
      })
  },
})

export const {
  clearLastResult,
  closePremiumOffer,
  openPremiumOffer,
  openGuestOffer,
  closeGuestOffer,
} = exerciseSlice.actions
export { fetchCompleteExercise }
export default exerciseSlice.reducer
