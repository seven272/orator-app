// src/utils/axiosInstance.js

import axios from 'axios'

const BASE_URL =
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5020/api'
    : '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Перехватчик ответов сервера
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const httpStatus = error.response.status
      const requestUrl = error.config?.url || ''
      const errorData = error.response.data || {}

      // ИСКЛЮЧЕНИЕ: Роуты авторизации (их не редиректим при ошибках)
      const isAuthRoute =
        requestUrl.includes('/user/register') ||
        requestUrl.includes('/user/login') ||
        requestUrl.includes('/user/vk-auth') ||
        requestUrl.includes('/user/vk-register')

        // ИСКЛЮЧЕНИЕ 2: Исчерпание суточных лимитов энергии
      const isEnergyLimitError = errorData.code === 'ENERGY_EXHAUSTED'

      if (!isAuthRoute && !isEnergyLimitError) {
        
        // 🔒 1. Если пользователь НЕ авторизован (Анониму пришёл статус 401)
        if (httpStatus === 401) {
          window.location.hash = '/auth' 
          return Promise.reject(error)
        }

        // 🎟️ 2. Если авторизован, но нет Премиума / билетов (Пришёл статус 403 и ACCESS_DENIED)
        if (httpStatus === 403 && errorData.code === 'ACCESS_DENIED') {
          window.location.hash = '/forbidden' // Мгновенно рендерим страницу 403
          return Promise.reject(error)
        }

        // 🦊 3 Гость из ВК (Статус 403 + REGISTRATION_REQUIRED)
        // Уводим на главную, а не на экран блокировки
        if (httpStatus === 403 && errorData.code === 'REGISTRATION_REQUIRED') {
          window.location.hash = '/' 
          return Promise.reject(error)
        }

        // 🛑 4. Глобальный редирект для любых других критических ошибок 403
        if (httpStatus === 403) {
          window.location.hash = '/forbidden'
          return Promise.reject(error)
        }
      }
    }

    return Promise.reject(error)
  },
)

export default axiosInstance
