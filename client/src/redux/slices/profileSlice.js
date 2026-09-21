import {
  createSlice,
  createAsyncThunk,
  isAnyOf,
} from '@reduxjs/toolkit'

import axiosInstance from '../../utils/axiosInstance'

import { fetchSubmitChallengeReport } from './challengeSlice'
// Импортируем Thunk обычного тренажера
import { fetchCompleteExercise } from './exerciseSlice'
// импорт покупки курса и рестарта
import {
  fetchActivateFakeCourse,
  fetchRestartCourse,
} from './courseSlice'
//импорт покупки ачивок в магазине
import { fetchPurchaseItem } from './shopSlice'
//импорт покупки ачивок в магазине
import { fetchLogoutUser } from './authSlice'
//импорт выполнения фич (подписка, избранное) из вк
import { fetchClaimVkBonus } from './vkSlice'
// Импортируем Thunk-экшены завершения ИИ-тренажеров
import { fetchFinishDebate } from './ai-exercises/debateSlice'
import { fetchFinishIcebreaker } from './ai-exercises/icebreakerSlice'
import { fetchFinishInterview } from './ai-exercises/interviewSlice'
import { fetchFinishTribune } from './ai-exercises/tribuneSlice'
import { fetchFinishAlibi } from './ai-exercises/alibiSlice'
import { fetchFinishBargain } from './ai-exercises/bargainSlice'
import { fetchFinishMetaphor } from './ai-exercises/metaphorSlice'
import { fetchFinishPoemTongue } from './ai-exercises/poemTongueSlice'
import { fetchFinishStopWord } from './ai-exercises/stopWordSlice'
import { fetchFinishPoemActing } from './ai-exercises/poemActingSlice'
import { fetchFinishPoemRap } from './ai-exercises/poemRapSlice'
import { fetchFinishRadioHost } from './ai-exercises/radioHostSlice'
import { fetchFinishRandomWord } from './ai-exercises/randomWordSlice'
import { fetchFinishHistorical } from './ai-exercises/historicalSlice'
import { fetchSubmitLiveRating } from './liveDuelSlice'
import { fetchFinishLiveDuelAiBot } from './liveDuelSlice'

// Один универсальный запрос для получения всех данных профиля и дашборда
const fetchProfileData = createAsyncThunk(
  'profile/fetchProfileData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        '/user/get-data-profile',
      )
      return response.data // Ждем объект { user, skills, weakPoint, recentActivity, totalExercises }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка загрузки профиля',
      )
    }
  },
)

const fetchActivateFakePremium = createAsyncThunk(
  'profile/fetchActivateFakePremium',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/user/fake-buy')
      return response.data // Ждем { isPremium: true, premiumExpiresAt: ... }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка активации Премиума',
      )
    }
  },
)

const initialState = {
  user: {
    displayName: '',
    level: 0,
    coins: 0,
    streak: 0,
    xp: 0,
    lifetimeXp: 0,
    achievements: [],
    inventory: [],
    levelProgressPercent: 0,
    completed_days: ['2000-01-15', '2000-01-16', '2000-01-17'],
    isPremium: false,
    premiumExpiresAt: null,
    activePurchasedCourses: [],
    dailyEnergy: {
      allowed: 15,
      used: 0,
    },
  },
  skills: [
    { subject: 'коммуникация', A: 0, fullMark: 100 },
    { subject: 'харизма и юмор', A: 0, fullMark: 100 },
    { subject: 'находчивость', A: 0, fullMark: 100 },
    { subject: 'техника речи', A: 0, fullMark: 100 },
    { subject: 'убедительность', A: 0, fullMark: 100 },
  ],
  weakPoint: {
    skill: '', // например, техника речи
    score: 3,
    recommendation: `Твой навык "..." требует внимания. Попробуй улучшить его!`,
  },
  recentActivity: [], //последние 5 сделанных упражнений
  totalExercises: 0,
  lastAwarded: null, // Сюда кладем новую ачивку для триггера модалки
  isStale: false,
  loading: false,
  isPremiumModalOpen: false,
  error: null,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Можно добавить экшен для локального обновления монет после покупки
    updateCoins: (state, action) => {
      if (state.user) state.user.coins = action.payload
    },
    setTotalPoints: (state, action) => {
      if (state.user) state.user.xp = action.payload
    },
    clearLastAwarded: (state) => {
      state.lastAwarded = null
    },
    updateCoinsAndInventory: (state, action) => {
      if (state.user) {
        state.user.coins = action.payload.coins
        state.user.inventory = action.payload.inventory
      }
    },
    updateRewardAfterCourse: (state, action) => {
      // Извлекаем объект наград из пришедших данных
      const rewards = action.payload.progressData?.rewards

      // Если rewards или xp отсутствуют, прибавляем 0 (защита от NaN)
      state.user.xp = state.user.xp + (rewards?.xp ?? 0)
      state.user.coins = state.user.coins + (rewards?.coins ?? 0)
      state.user.lifetimeXp =
        state.user.lifetimeXp + (rewards?.xp ?? 0)

      // 🔥 Записываем новые ачивки в стейт профиля.
      if (action.payload.progressData?.newAchievements.length > 0) {
        state.lastAwarded =
          action.payload.progressData?.newAchievements[0]
      }

      // Обновляем массив ачивок (если новых нет, бэкенд пришлет пустой массив [])
      state.user.achievements =
        action.payload.progressData?.newAchievements
    },
    // Вручную синхронизируем премиум, если данные пришли через другой триггер
    setPremiumStatus: (state, action) => {
      if (state.user) {
        state.user.isPremium = action.payload.isPremium
        state.user.premiumExpiresAt = action.payload.premiumExpiresAt
      }
    },
    // Редюсер локального списания энергии для гостевого режима (из localStorage)
    syncGuestEnergy: (state, action) => {
      if (state.user) {
        // action.payload — это чистый текущий остаток энергии в localStorage (от 0 до 3)
        const currentLeft = action.payload

        state.user.dailyEnergy = {
          allowed: 3,
          used: 3 - currentLeft, // Если в localStorage 0, то used = 3 - 0 = 3 (Бак полностью пуст!)
        }
      }
    },
    openPremiumModal: (state) => {
      state.isPremiumModalOpen = true
    },
    closePremiumModal: (state) => {
      state.isPremiumModalOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      //подписка на завершения челленджа
      .addCase(
        fetchSubmitChallengeReport.fulfilled,
        (state, action) => {
          // Проверяем структуру вашего стейта профиля (ориентируемся на user или profile)
          if (state.user) {
            state.user.coins = action.payload.data.user.coins
            state.user.level = action.payload.data.user.level
            state.user.xp = action.payload.data.user.xp
            state.user.lifetimeXp =
              action.payload.data.user.lifetimeXp
            // 🔥 Записываем новые ачивки в стейт профиля.
            if (
              action.payload.data.user.newAchievements?.length > 0
            ) {
              state.lastAwarded =
                action.payload.data.user.newAchievements[0]
            }
          }
        },
      )
      // подписка на покупку курса
      .addCase(fetchActivateFakeCourse.fulfilled, (state, action) => {
        if (state.user) {
          state.user.activePurchasedCourses =
            action.payload.activePurchasedCourses
        }
      })
      // Подписка на рестарт курса - удаляем из массива купленных курсов
      .addCase(fetchRestartCourse.fulfilled, (state, action) => {
        if (state.user?.activePurchasedCourses) {
          // action.meta.arg содержит аргумент thunk'а — наш courseCode
          state.user.activePurchasedCourses =
            state.user.activePurchasedCourses.filter(
              (code) => code !== action.meta.arg,
            )
        }
      })
      // Подписка на покупку ачивок в магазине и премиума
      .addCase(fetchPurchaseItem.fulfilled, (state, action) => {
        //если куплен премиум, пушим его, если куплены ачивки -пушим ачивки
        if (action.payload.isPremium) {
          state.user.isPremium = action.payload.isPremium
        }
        if (
          action.payload?.newAchievements &&
          action.payload.newAchievements.length > 0
        ) {
          // Записываем самую первую ачивку в lastAwarded — это стриггерит модалку поздравления!
          state.lastAwarded = action.payload.newAchievements[0]

          // Синхронизируем массив ачивок в объекте пользователя
          if (!state.user.achievements) {
            state.user.achievements = []
          }
          // Пушим новые ачивки в стейт профиля на фронтенде
          state.user.achievements.push(
            ...action.payload.newAchievements,
          )
        }
      })
      //Подписка на выход их аккаунта:
      .addCase(fetchLogoutUser.fulfilled, (state) => {
        const savedEnergy = localStorage.getItem(
          'govorix_guest_energy',
        )
        const currentLeft = savedEnergy
          ? parseInt(savedEnergy, 10)
          : 3

        state.user = {
          ...initialState.user, // Сбрасываем имя, монеты, опыт в 0
          dailyEnergy: {
            allowed: 3,
            used: 3 - currentLeft, // Железно восстанавливаем гостевой лимит из браузера!
          },
        }
      })
      // подписка на успех выполнения квеста из ВК-слайса
      .addCase(fetchClaimVkBonus.fulfilled, (state) => {
        state.user.coins += 10 
        state.user.xp += 100
        state.user.lifetimeXp += 100 
        state.user.dailyEnergy.used -= 5 // Срезаем 5 единиц потраченной емкости
      })
      //Загрузка данных профиля
      .addCase(fetchProfileData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProfileData.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.skills = action.payload.skills
        state.weakPoint = action.payload.weakPoint
        state.recentActivity = action.payload.recentActivity
        state.totalExercises = action.payload.totalExercises
      })
      .addCase(fetchProfileData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // покупка премиум
      .addCase(fetchActivateFakePremium.pending, (state) => {
        state.error = null
      })
      .addCase(
        fetchActivateFakePremium.fulfilled,
        (state, action) => {
          if (state.user) {
            state.user.isPremium = action.payload.isPremium
            state.user.premiumExpiresAt =
              action.payload.premiumExpiresAt
          }
        },
      )
      .addCase(fetchActivateFakePremium.rejected, (state, action) => {
        state.error = action.payload
      })
      // Глобальный слушатель для ЛЮБОГО успешно завершенного тренажера
      .addMatcher(
        isAnyOf(
          fetchCompleteExercise.fulfilled,
          fetchFinishDebate.fulfilled,
          fetchFinishInterview.fulfilled,
          fetchFinishIcebreaker.fulfilled,
          fetchFinishTribune.fulfilled,
          fetchFinishAlibi.fulfilled,
          fetchFinishBargain.fulfilled,
          fetchFinishMetaphor.fulfilled,
          fetchFinishPoemTongue.fulfilled,
          fetchFinishStopWord.fulfilled,
          fetchFinishPoemActing.fulfilled,
          fetchFinishPoemRap.fulfilled,
          fetchFinishRadioHost.fulfilled,
          fetchFinishRandomWord.fulfilled,
          fetchSubmitLiveRating.fulfilled,
          fetchFinishLiveDuelAiBot.fulfilled,
          fetchFinishHistorical.fulfilled,
        ),
        (state, action) => {
          // Защита: если сессия завершилась без оценки, stats будет отсутствовать
          if (!action.payload || !action.payload.stats) return

          if (state.user) {
            //Извлекаем суточную энергию, если она вернулась (для тренажеров 1 и 2 уровней)
            if (action.payload.dailyEnergy) {
              state.user.dailyEnergy = action.payload.dailyEnergy
            }
            // Атомарно обновляем показатели профиля
            state.user.level = action.payload.stats.level
            state.user.xp = action.payload.stats.xp
            state.user.coins = action.payload.stats.coins
            state.user.streak = action.payload.stats.streak
            state.user.completed_days =
              action.payload.stats.completed_days

            // ЛОГИКА АЧИВОК (Поздравляем строго с ОДНИМ достижением)
            if (
              action.payload.newAchievements &&
              action.payload.newAchievements.length > 0
            ) {
              // берем только самую первую ачивку из массива
              state.lastAwarded = action.payload.newAchievements[0]

              if (!state.user.achievements) {
                state.user.achievements = []
              }
              state.user.achievements.push(
                ...action.payload.newAchievements,
              )
            }
          }

          // Помечаем данные как "устаревшие" для обновления радарной карты
          state.isStale = true
        },
      )
  },
})

export const {
  updateCoins,
  clearLastAwarded,
  updateCoinsAndInventory,
  setTotalPoints,
  updateRewardAfterCourse,
  setPremiumStatus,
  syncGuestEnergy,
  openPremiumModal,
  closePremiumModal,
} = profileSlice.actions
export { fetchProfileData, fetchActivateFakePremium }
export default profileSlice.reducer
