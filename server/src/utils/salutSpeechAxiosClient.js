import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import https from 'https'

// Создаем агент, который игнорирует проверку сертификатов Сбера
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
})

let cachedToken = null
let tokenExpiresAt = 0

// 1. Получение OAuth-токена для SalutSpeech
const getSalutSpeechToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken
  }
  try {
    // Формируем Basic Auth заголовок из ID и Secret для Салюта
    const authHeader = Buffer.from(
      `${process.env.SALUTE_SPEECH_CLIENT_ID}:${process.env.SALUTE_SPEECH_CLIENT_SECRET}`,
    ).toString('base64')

    const response = await axios({
      method: 'post',
      url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      httpsAgent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        RqUID: uuidv4(),
        Authorization: `Basic ${authHeader}`,
      },
      data: new URLSearchParams({
        scope:
          process.env.SALUTE_SPEECH_SCOPE || 'SALUTE_SPEECH_PERS',
      }).toString(),
    })

    cachedToken = response.data.access_token
    tokenExpiresAt = response.data.expires_at
    return cachedToken
  } catch (error) {
    console.error(
      'Детали ошибки OAuth SalutSpeech:',
      error.response?.data || error.message,
    )
    throw error
  }
}

//  Настройка инстанса Axios для SalutSpeech
const salutSpeechAxiosClient = axios.create({
  baseURL: 'https://smartspeech.sber.ru',
  httpsAgent,
  headers: {
    Accept: 'application/json',
  },
})

// Интерцептор для автоматической подстановки токена перед каждым запросом
salutSpeechAxiosClient.interceptors.request.use(async (config) => {
  const token = await getSalutSpeechToken()
  config.headers.Authorization = `Bearer ${token}`
  return config
})

// Вспомогательный таймаут для асинхронного режима
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

/**
 * МЕТОД 1: Синхронное распознавание коротких аудиофайлов (до 20 секунд)
 * Подходит для "Интервью" и "Дебатов". Работает максимально быстро.
 */

const transcribeShortAudio = async (audioBuffer) => {
  try {
    // Так как на клиенте мы настроили чистый WAV, заголовок всегда фиксирован
    const sberAudioHeader = 'audio/x-pcm;bit=16;rate=16000'

    const response = await salutSpeechAxiosClient({
      method: 'post',
      url: '/rest/v1/speech:recognize',
      headers: {
        'Content-Type': sberAudioHeader,
      },
      data: audioBuffer,
    })

    if (response.data?.result?.length > 0) {
      return response.data.result[0]
    }
    return ''
  } catch (error) {
    console.error(
      'Ошибка синхронного SalutSpeech:',
      error.response?.status,
      error.response?.data || error.message,
    )
    throw new Error('Speech recognition service error')
  }
}

/*
 * МЕТОД 2: Асинхронное распознавание длинных аудиофайлов через внутреннее облако Сбера
 * Используется в монологах ("Трибуна"). Полностью обходит лимит на размер тела запроса.
 */
const transcribeLongAudio = async (audioBuffer) => {
  try {
    const sberAudioHeader = 'audio/x-pcm;bit=16;rate=16000'

    console.log('📂 ЭТАП 1: Загрузка файла в облачный буфер Сбера...')
    const uploadResponse = await salutSpeechAxiosClient({
      method: 'post',
      url: '/rest/v1/data:upload',
      headers: {
        'Content-Type': sberAudioHeader,
      },
      data: audioBuffer,
    })

    const fileId = uploadResponse.data?.result?.request_file_id

    if (!fileId) {
      throw new Error(
        `Сбербанк вернул пустой ID загруженного файла. Ответ сервера: ${JSON.stringify(uploadResponse.data)}`,
      )
    }

    console.log(`✅ Файл успешно сохранен в Сбере. FileID: ${fileId}`)

    console.log(
      '🔄 ЭТАП 2: Инициализация асинхронной транскрибации...',
    )
    const startResponse = await salutSpeechAxiosClient({
      method: 'post',
      url: '/rest/v1/speech:async_recognize',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        options: {
          model: 'general',
          audio_encoding: 'PCM_S16LE',
          sample_rate: 16000,
          channels_count: 1,
        },
        request_file_id: fileId,
      },
    })

    const taskId =
      startResponse.data?.id || startResponse.data?.result?.id

    if (!taskId) {
      throw new Error(
        `Сбербанк не вернул ID асинхронной задачи (task_id). Ответ сервера: ${JSON.stringify(startResponse.data)}`,
      )
    }

    console.log(
      `🆔 Задача создана: ${taskId}. Начинаем опрос статуса...`,
    )

    // ЭТАП 3: Механизм пуллинга (polling)
    const maxAttempts = 40
    let attempts = 0

    while (attempts < maxAttempts) {
      attempts++
      await delay(1500)

      const statusResponse = await salutSpeechAxiosClient({
        method: 'get',
        url: `/rest/v1/task:get?id=${taskId}`,
      })

      const taskStatus = statusResponse.data?.result?.status

      if (taskStatus === 'DONE') {
        console.log(
          `✅ Расшифровка успешно завершена Сбером на попытке №${attempts}!`,
        )

        // Получаем ID файла с результатом
        const responseFileId =
          statusResponse.data?.result?.response_file_id

        if (!responseFileId) {
          throw new Error(
            'Сбербанк сообщил об успешном завершении, но не прислал response_file_id',
          )
        }

        console.log(
          `📥 ЭТАП 4: Скачивание итогового текста по response_file_id`,
        )

        // Возвращаем метод GET, но передаем ПРАВИЛЬНОЕ имя query-параметра: response_file_id
        const downloadResponse = await salutSpeechAxiosClient({
          method: 'get',
          url: `/rest/v1/data:download?response_file_id=${responseFileId}`,
        })

        // Сбер возвращает JSON-структуру с распознанными фразами
        const sberResultData = downloadResponse.data

        console.log(
          '📝 [DEBUG] Успешно скачаны текстовые данные от Сбера:',
          JSON.stringify(sberResultData),
        )

        // Безопасно извлекаем normalized_text из структуры ответа Сбера
        if (
          Array.isArray(sberResultData) &&
          sberResultData.length > 0
        ) {
          // Проходим по всем блокам распознавания (если их несколько для длинной речи)
          const fullText = sberResultData
            .map((block) => {
              // Ищем первую лучшую гипотезу внутри результатов блока
              const firstResult = block?.results?.[0]
              // Отдаем текст с пунктуацией (normalized_text), либо обычный raw-текст
              return (
                firstResult?.normalized_text ||
                firstResult?.text ||
                ''
              )
            })
            .filter(Boolean)
            .join(' ')

          return fullText.trim()
        }

        return ''
      }

      if (taskStatus === 'ERROR') {
        const errorMsg =
          statusResponse.data?.result?.error || 'Unknown error'
        throw new Error(
          `Сбербанк вернул внутреннюю ошибку задачи: ${errorMsg}`,
        )
      }

      console.log(
        `⏳ Сбер обрабатывает аудио (Статус: ${taskStatus || 'В процессе'}). Попытка ${attempts}...`,
      )
    }

    throw new Error(
      'Превышено время ожидания ответа от асинхронного сервиса Сбера',
    )
  } catch (error) {
    console.error(
      'Ошибка асинхронного SalutSpeech:',
      error.response?.status,
      error.response?.data || error.message,
    )
    throw new Error('Speech recognition service error')
  }
}

/**
 * Отправляет аудиофайл на распознавание в SalutSpeech REST API
 * @param {Buffer} audioBuffer - Бинарные данные аудиофайла из multer
 * @param {string} mimeType - MIME-тип пришедшего файла (audio/wav, audio/webm, audio/ogg и т.д.)
 * @returns {Promise<string>} Распознанный текст реплики пользователя
 */
// const transcribeAudioFile = async (audioBuffer, mimeType) => {
//   try {
//     // Форматируем заголовки под требования Сбера
//     let sberAudioHeader = 'audio/x-pcm;bit=16;rate=16000'

//     if (mimeType.includes('mpeg') || mimeType.includes('mp3')) {
//       sberAudioHeader = 'audio/mpeg'
//     } else if (
//       mimeType.includes('ogg') ||
//       mimeType.includes('opus') ||
//       mimeType.includes('webm')
//     ) {
//       sberAudioHeader = 'audio/ogg;codecs=opus'
//     }

//     // Исполняем запрос с корректным путем /rest/v1/speech:recognize
//     const response = await salutSpeechAxiosClient({
//       method: 'post',
//       url: '/rest/v1/speech:recognize',
//       headers: {
//         'Content-Type': sberAudioHeader,
//       },
//       data: audioBuffer, // Передаем буфер напрямую в тело запроса
//     })

//     // Сбер возвращает массив гипотез текста, забираем самый первый/точный результат
//     if (response.data?.result?.length > 0) {
//       return response.data.result[0]
//     }

//     return ''
//   } catch (error) {
//     // Добавляем развернутый вывод ошибки, чтобы видеть статус от Сбера в логах
//     console.error(
//       'Ошибка распознавания речи в SalutSpeech:',
//       error.response?.status,
//       error.response?.data || error.message,
//     )
//     throw new Error('Speech recognition service error', { cause: error })
//   }
// }

export { transcribeLongAudio, transcribeShortAudio }
export default salutSpeechAxiosClient
