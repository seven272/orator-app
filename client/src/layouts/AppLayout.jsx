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
  const { isLoading, user, isGuest } = useSelector(
    (state) => state.auth,
  )

  useEffect(() => {
    const initializeGovorix = async () => {
      // 🚀 ВРЕМЕННЫЙ ДЕБАГ-ЛОГ
      console.log('--- ДЕБАГ ЗАПУСКА GOVORIX ---')
      console.log('1. Полный URL страницы:', window.location.href)
      console.log(
        '2. Значение window.location.search:',
        window.location.search,
      )
      console.log(
        '3. Значение window.location.hash:',
        window.location.hash,
      )

      const launchParams = window.location.search

      // 🚀 ВРЕМЕННЫЙ ДЕБАГ-ЛОГ
      if (launchParams.includes('vk_user_id')) {
        console.log('🎯 Среда ВК успешно обнаружена через search!')
        // ... твой код fetchVkAuth
      } else if (window.location.hash.includes('vk_user_id')) {
        console.warn(
          '⚠️ Среда ВК найдена в HASH! Нужно брать параметры оттуда.',
        )
      } else {
        console.error('❌ Среда ВК вообще не обнаружена в URL.')
      }

      // 1. Проверяем среду запуска: Mini App ВК
      if (launchParams.includes('vk_user_id')) {
        try {
          // .unwrap() заставляет промис вернуть чистые данные из payload,
          // либо выкинуть ошибку (catch), если бэкенд ответил отказом.
          // Это гарантирует 100% последовательность выполнения.
          await dispatch(fetchVkAuth({ launchParams })).unwrap()

          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        } catch (error) {
          console.error('Ошибка инициализации ВК сессии:', error)
        }
      } else {
        // 2. Обычный сайт Govorix.ru
        try {
          await dispatch(fetchGetMe()).unwrap()

          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        } catch (error) {
          console.log(
            'Пользователь не авторизован (анонимный гость сайта)',
          )
          // Для сайта — если куки нет, мы просто тушим лоадер (это происходит внутри extraReducers.fetchGetMe.rejected)
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
        <h2 className={styles.loading_title}>
          Синхронизация с Govorix.ru
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
      {isGuest && user && (
        <div className={styles.guest_badge_banner}>
          ⚡ Гостевой режим ВК. Прогресс пишется в память до первого
          челленджа или покупки.
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
