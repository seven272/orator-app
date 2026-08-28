import axios from 'axios'

const BASE_URL =
  // local development/production
  import.meta.env.MODE === 'development'
    ? 'http://localhost:5020/api'
    : '/api'

  //public devolopment / production
  // import.meta.env.MODE === 'development'
  //   ? 'https://prank-sound.ru/api'
  //   : '/api'
//Свойство withCredentials в библиотеке Axios для работы с HTTP-запросами указывает, включать ли в запрос учётные данные (например, cookies и заголовки авторизации).
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})
export default axiosInstance
