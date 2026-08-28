import { configureStore } from '@reduxjs/toolkit'

import authSlice from './slices/authSlice'
import exerciseSlice from './slices/exerciseSlice'
import profileSlice from './slices/profileSlice'
import dailySlice from './slices/dailySlice'
import leaderboardSlice from './slices/leaderboardSlice'
import shopSlice from './slices/shopSlice'
import challengeSlice from './slices/challengeSlice'
import adminSlice from './slices/adminSlice'
import liveDuelSlice from './slices/liveDuelSlice'
import courseSlice from './slices/courseSlice'
//слайсы ИИ тренажеров
import aiSlices from './slices/ai-exercises/index'


const store = configureStore({
  reducer: {
    auth: authSlice,
    profile: profileSlice,
    exercise: exerciseSlice,
    daily: dailySlice,
    leaderboard: leaderboardSlice,
    shop: shopSlice,
    challenge: challengeSlice,
    admin: adminSlice,
    liveDuel: liveDuelSlice,
    course: courseSlice,
    //ИИ тренажеры
    ...aiSlices
  },
})

export default store
