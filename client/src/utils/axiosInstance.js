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
    // Проверяем, если сервер вернул ошибку 403 (Вы не являетесь администратором)
    if (error.response && error.response.status === 403) {
       console.error('🚨 КРИТИЧЕСКИЙ ДЕБАГ 403!');
      console.error(`Метод запроса: ${error.config?.method?.toUpperCase()}`);
      console.error(`Упавший URL роута: ${error.config?.url}`);
      console.error('Данные ответа сервера:', error.response.data);
      // Так как у вас используется createHashRouter,
      // принудительно меняем хэш URL, чтобы роутер переключился на страницу 403
      window.location.hash = '/forbidden'
    }

    // Возвращаем ошибку дальше, чтобы Thunk мог её обработать при необходимости
    return Promise.reject(error)
  },
)
export default axiosInstance
