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

      // 🔥 ИСКЛЮЧЕНИЕ: Если ошибка 403 пришла от роутов регистрации или входа, 
      // никуда пользователя НЕ перенаправляем, отдаем ошибку форме!
      const isAuthRoute = 
        requestUrl.includes('/user/register') || 
        requestUrl.includes('/user/login') || 
        requestUrl.includes('/user/vk-auth') ||
        requestUrl.includes('/user/vk-register')

      if (!isAuthRoute) {
        // Во всех остальных случаях (например, если обычный юзер ломится в админку) — уводим на 403
        window.location.hash = '/forbidden'
      }
    }

    // Возвращаем ошибку дальше, чтобы Thunk мог её обработать при необходимости
    return Promise.reject(error)
  },
)
export default axiosInstance
