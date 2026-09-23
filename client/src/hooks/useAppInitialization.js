// hooks/useAppInitialization.js
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { parseURLSearchParamsForGetLaunchParams } from '@vkontakte/vk-bridge'

import { fetchGetMe, fetchVkAuth } from '../redux/slices/authSlice'
import { fetchProfileData } from '../redux/slices/profileSlice'
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice' 
import { showOnboarding } from '../utils/vk-utils/vkShowOnboarding'

/**
 * Кастомный хук для инициализации сессии Govorix при старте приложения.
 * Автоматически распознает среду запуска (ВК-скрипты или Сайт) и наполняет Redux-стейт.
 */
const useAppInitialization = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const initializeGovorix = async () => {
      const launchParamsString = window.location.search

      // 1. Проверяем, запущены ли мы внутри экосистемы ВКонтакте
      if (launchParamsString.includes('vk_user_id')) {
        try {
          const parsedVkParams =
            parseURLSearchParamsForGetLaunchParams(launchParamsString)

          // Дожидаемся валидации подписи ВК и авторизации на бэкенде [INDEX]
          const resData = await dispatch(
            fetchVkAuth({ launchParams: parsedVkParams }),
          ).unwrap()
          // показываем приветсвенный онбординг 1 раз
           showOnboarding()

          // Загружаем данные профиля и рейтинги только если бэкенд подтвердил, что это НЕ гость
          if (resData && !resData.isVkGuest) {
            await dispatch(fetchProfileData()).unwrap() 
            dispatch(fetchLeaderboard())
          }
          // Если это гость — цепочка завершена, extraReducers в authSlice выключат isLoading
        } catch (error) {
          console.error('Ошибка инициализации ВК сессии:', error)
        }
      } else {
        // 2. Сценарий запуска на обычном браузере Сайта Govorix.ru
        try {
          await dispatch(fetchGetMe()).unwrap()
          await dispatch(fetchProfileData()).unwrap() 
          dispatch(fetchLeaderboard())
        } catch (error) {
          console.error(
            'Пользователь не авторизован (анонимный гость сайта):',
            error,
          )
        }
      }
    }

    initializeGovorix()
  }, [dispatch])
}
export { useAppInitialization }
