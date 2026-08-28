import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import AchievementModal from '../components/achievement-modal/AchievementModal'
import { fetchGetMe } from '../redux/slices/authSlice'
import { fetchProfileData } from '../redux/slices/profileSlice'
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice'

import styles from './AppLayout.module.css'

const AppLayout = () => {
  const dispatch = useDispatch()

  // 📌 Загружаем критически важные данные один раз при старте приложения
  useEffect(() => {
    dispatch(fetchGetMe())
    dispatch(fetchProfileData())
    dispatch(fetchLeaderboard())
  }, [dispatch])

  return (
    <div className={styles.app_global_container}>
      <main className={styles.app_main_viewport}>
        {/* 📌 Сюда React Router будет автоматически подставлять активную страницу */}
        <Outlet />
      </main>
      <AchievementModal />
    </div>
  )
}

export default AppLayout
