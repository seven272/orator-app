import axios from 'axios'

const BASE_URL =
  // local development/production
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5020/api'
    : '/api'

//Свойство withCredentials в библиотеке Axios для работы с HTTP-запросами указывает, включать ли в запрос учётные данные (например, cookies и заголовки авторизации).
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Перехватчик ответов сервера (для ошибки 403)
axiosInstance.interceptors.response.use(
  (response) => {
    // Если запрос успешный, просто возвращаем данные дальше
    return response
  },
  (error) => {
    // Проверяем, если сервер вернул ошибку 403
    if (error.response && error.response.status === 403) {
      const requestUrl = error.config?.url || ''
      const errorData = error.response.data || {}

      //  ИСКЛЮЧЕНИЕ 1: Роуты авторизации
      const isAuthRoute =
        requestUrl.includes('/user/register') ||
        requestUrl.includes('/user/login') ||
        requestUrl.includes('/user/vk-auth') ||
        requestUrl.includes('/user/vk-register')

      //  ИСКЛЮЧЕНИЕ 2: Исчерпание суточных лимитов энергии (не редиректить, отдавать Thunk-у)
      const isEnergyLimitError = errorData.code === 'ENERGY_EXHAUSTED'

      if (!isAuthRoute && !isEnergyLimitError) {
        // Уводим на 403 только если это не форма входа и не лимит энергии
        window.location.hash = '/forbidden'
      }
    }

    // Возвращаем ошибку дальше, чтобы Thunk мог её обработать при необходимости
    return Promise.reject(error)
  },
)
export default axiosInstance
