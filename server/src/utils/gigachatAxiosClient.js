import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import https from 'https'

// Создаем агент, который игнорирует проверку сертификатов
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

let cachedToken = null
let tokenExpiresAt = 0

const getAccessToken = async() => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }
  try {
    const response = await axios({
      method: 'post',
      url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Без этого в Node.js не взлетит, отмена проверки сертификатов
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: uuidv4(),
        Authorization: `Basic ${process.env.GIGACHAT_API_KEY}`,
      },
      // Используем URLSearchParams — это встроенный аналог qs.stringify
      data: new URLSearchParams({
        scope: 'GIGACHAT_API_PERS',
      }).toString(),
    })

    cachedToken = response.data.access_token
    tokenExpiresAt = response.data.expires_at
    return cachedToken
  } catch (error) {
    console.error(
      'Детали ошибки OAuth:',
      error.response?.data || error.message,
    )
    throw error
  }
}

// 2. Настройка клиента для запросов
const gigachatAxiosClient = axios.create({
  baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
  httpsAgent,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})
// Интерцептор для подстановки токена
gigachatAxiosClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

export default gigachatAxiosClient
