import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge'

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
      const launchParamsString = window.location.search

      // 1. Проверяем среду запуска: Mini App ВК
      if (launchParamsString.includes('vk_user_id')) {
        try {
          // 🔥 Используем встроенный парсер ВК для получения идеального объекта параметров
          const parsedVkParams =
            parseURLSearchParamsForGetLaunchParams(launchParamsString)

          // Шлем на бэкенд уже готовый, кристально чистый объект параметров вместо строки!
          await dispatch(
            fetchVkAuth({ launchParams: parsedVkParams }),
          ).unwrap()

          dispatch(fetchProfileData())
          dispatch(fetchLeaderboard())
        } catch (error) {
          // Ошибка 403 из-за подписи теперь не случится, но лог оставляем для контроля
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
        }
      }
    }

    initializeGovorix()
  }, [dispatch])

  useEffect(() => {
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
