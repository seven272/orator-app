import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'

import AchievementModal from '../components/achievement-modal/AchievementModal'
import { fetchGetMe, fetchVkAuth } from '../redux/slices/authSlice'
import { fetchProfileData } from '../redux/slices/profileSlice'
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice'

import styles from './AppLayout.module.css'

const AppLayout = () => {
  const dispatch = useDispatch()
  
  // Реактивное состояние загрузки и режима гостя
  const { isLoading, user, isGuest } = useSelector((state) => state.auth)

  useEffect(() => {
    const initializeGovorix = async () => {
      const launchParams = window.location.search

      // 1. Проверяем среду запуска: Mini App ВК
      if (launchParams.includes('vk_user_id')) {
        const result = await dispatch(fetchVkAuth({ launchParams }))
        
        if (fetchVkAuth.fulfilled.match(result)) {
          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        }
      } else {
        // 2. Обычный сайт Govorix.ru
        const result = await dispatch(fetchGetMe())
        
        if (fetchGetMe.fulfilled.match(result)) {
          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        }
      }
    }

    initializeGovorix()
  }, [dispatch])

  // 📌 Безопасный Splash Screen на чистом CSS
  if (isLoading) {
    return (
      <div className={styles.loading_splash_screen}>
        <div className={styles.custom_loader_circle}></div>
        <h2 className={styles.loading_title}>Синхронизация с Govorix.ru</h2>
        <p className={styles.loading_subtitle}>Прокачиваем навыки ораторского искусства</p>
      </div>
    )
  }

  // 📌 Основной рендер приложения после прохождения авторизации
  return (
    <div className={styles.app_global_container}>
      {isGuest && user && (
        <div className={styles.guest_badge_banner}>
          ⚡ Гостевой режим ВК. Прогресс пишется в память до первого челленджа или покупки.
        </div>
      )}

      <main className={styles.app_main_viewport}>
        <Outlet />
      </main>
      <AchievementModal />
    </div>
  )
}

export default AppLayout

