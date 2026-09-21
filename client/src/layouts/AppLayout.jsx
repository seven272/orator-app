import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge'

import AchievementModal from '../components/modal/achievement-modal/AchievementModal'
import EnergyLimitAlert from '../components/modal/energy-limit-alert/EnergyLimitAlert'
import EnergyGuestAlert from '../components/modal/energy-guest-alert/EnergyGuestAlert'
import PremiumModal from '../components/modal/premium-modal/PremiumModal'
import ViralBonusModal from '../components/modal/viral-bonus-modal/ViralBonusModal' // 🤖 НОВЫЙ ИМПОРТ

import {
  fetchGetMe,
  fetchVkAuth,
  checkIsVkGuest,
} from '../redux/slices/authSlice'
import { fetchProfileData } from '../redux/slices/profileSlice'
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice'
import {
  openViralModal,
  fetchUpdateViralModalTimer,
} from '../redux/slices/vkSlice'
import { useVkEnvironment } from '../hooks/useVkEnvironment'
import styles from './AppLayout.module.css'

const AppLayout = () => {
  const dispatch = useDispatch()
  const isVkEnvironment = useVkEnvironment()
  // Реактивное состояние загрузки и режима гостя
  const { isLoading } = useSelector((state) => state.auth)
  const isVkGuest = useSelector(checkIsVkGuest)

  const { user } = useSelector((state) => state.profile)
  // Читаем служебные флаги из изолированного ВК-слайса
  const { viralBonusesClaimed, lastViralModalShown } = useSelector(
    (state) => state.vk,
  )

  useEffect(() => {
    const initializeGovorix = async () => {
      const launchParamsString = window.location.search

      if (launchParamsString.includes('vk_user_id')) {
        try {
          const parsedVkParams =
            parseURLSearchParamsForGetLaunchParams(launchParamsString)

          // 1. Дожидаемся ответа от vk-auth
          const resData = await dispatch(
            fetchVkAuth({ launchParams: parsedVkParams }),
          ).unwrap()

          // 2. Загружаем профиль только если бэкенд сказал, что это НЕ гость
          if (resData && !resData.isVkGuest) {
            dispatch(fetchProfileData())
            dispatch(fetchLeaderboard())
          }

          // Если это гость — цепочка завершилась штатно, extraReducers выключат isLoading
        } catch (error) {
          console.error('Ошибка инициализации ВК сессии:', error)
        }
      } else {
        // Обычный сайт Govorix.ru
        try {
          await dispatch(fetchGetMe()).unwrap()
          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        } catch (error) {
          console.log(
            'Пользователь не авторизован (анонимный гость сайта)',
          )
        }
      }
    }

    initializeGovorix()
  }, [dispatch])

  // Автоматический триггер показа «Центра бонусов» в ВК
  useEffect(() => {
    if (isLoading || !user) return
    //  Используем нативный хук вместо window.location.search.includes
    if (!isVkEnvironment || isVkGuest) return
    if (user.isPremium) return

    const isCooldownPassed =
      !lastViralModalShown ||
      Date.now() - new Date(lastViralModalShown).getTime() > 259200000

    if (!isCooldownPassed) return

    const hasUnfinishedTasks = Object.values(
      viralBonusesClaimed,
    ).includes(false)

    if (hasUnfinishedTasks) {
      dispatch(openViralModal())
      dispatch(fetchUpdateViralModalTimer())
    }
  }, [
    isLoading,
    user,
    isVkEnvironment,
    isVkGuest,
    viralBonusesClaimed,
    lastViralModalShown,
    dispatch,
  ])

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
    </div>
  )
}

export default AppLayout
