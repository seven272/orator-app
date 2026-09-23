import React from 'react'
import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'

import AchievementModal from '../components/modal/achievement-modal/AchievementModal'
import EnergyLimitAlert from '../components/modal/energy-limit-alert/EnergyLimitAlert'
import EnergyGuestAlert from '../components/modal/energy-guest-alert/EnergyGuestAlert'
import PremiumModal from '../components/modal/premium-modal/PremiumModal'
import ViralBonusModal from '../components/modal/viral-bonus-modal/ViralBonusModal'
import LevelUpModal from '../components/modal/level-up-modal/LevelUpModal'
//хуки
import { useAppInitialization } from '../hooks/useAppInitialization'
import { useLevelUpTrigger } from '../hooks/useLevelUpTrigger'

import styles from './AppLayout.module.css'

const AppLayout = () => {
  useAppInitialization()
  // useLevelUpTrigger()

  // Реактиное состояние загрузки и режима гостя
  const { isLoading } = useSelector((state) => state.auth)

 

  // 📌 Безопасный Splash Screen на чистом CSS
  if (isLoading) {
    return (
      <div className={styles.loading_splash_screen}>
        <div className={styles.custom_loader_circle}></div>
        <h2 className={styles.loading_title}>
          Синхронизация с Govorix
        </h2>
        <p className={styles.loading_subtitle}>
          Прокачиваем навыки ораторского искусства
        </p>
      </div>
    )
  }

  // 📌 Основной рендер приложения после прохождения авторизации
  return (
    <div className={styles.app_global_container}>
      <main className={styles.app_main_viewport}>
        <Outlet />
      </main>
      <AchievementModal />
      <EnergyLimitAlert />
      <EnergyGuestAlert />
      <PremiumModal />
      <ViralBonusModal />
      <LevelUpModal />
    </div>
  )
}

export default AppLayout
