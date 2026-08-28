/* eslint-disable preserve-caught-error */
import axios from 'axios'
import dotenv from 'dotenv'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

dotenv.config()

// Инициализируем переменные окружения Яндекса (рекомендуется вынести в .env)
const YANDEX_API_KEY = process.env.YANDEX_API_KEY || 'ВАШ_API_KEY'
const YANDEX_FOLDER_ID =
  process.env.YANDEX_FOLDER_ID || 'ВАШ_FOLDER_ID'
const BUCKET_NAME =
  process.env.YANDEX_BUCKET_NAME || 'ИМЯ_ВАШЕГО_БАКЕТА'
const YANDEX_AWS_ACCESS_KEY_ID =
  process.env.YANDEX_AWS_ACCESS_KEY_ID || 'ИДЕНТИФИКАТОР_КЛЮЧА'
const YANDEX_AWS_SECRET_ACCESS_KEY =
  process.env.YANDEX_AWS_SECRET_ACCESS_KEY || 'СЕКРЕТНЫЙ_КЛЮЧ'

// Вспомогательная пауза между проверками статуса задачи
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms))

const s3Client = new S3Client({
  region: 'ru-central1', // Регион Яндекс Облака
  endpoint: 'https://storage.yandexcloud.net', // Официальный адрес хранилища Яндекса
  forcePathStyle: true, // рекомендуется для совместимости
  credentials: {
    accessKeyId: YANDEX_AWS_ACCESS_KEY_ID || 'ИДЕНТИФИКАТОР_КЛЮЧА',
    secretAccessKey: YANDEX_AWS_SECRET_ACCESS_KEY || 'СЕКРЕТНЫЙ_КЛЮЧ',
  },
});

const transcribeShortAudio = async (audioBuffer) => {
  try {
    console.log(
      `📊 Исходный вес WAV файла: ${(audioBuffer.length / 1024).toFixed(2)} КБ`,
    )

    // 1. Отрезаем первые 44 байта заголовка WAV (RIFF...WAVE)
    // Оставляем чистый Linear PCM поток байтов, как требует документация Яндекса
    const rawPcmBuffer = audioBuffer.subarray(44)

    console.log(
      '🔄 ЭТАП 2: Отправка синхронного запроса на официальный URL Яндекса...',
    )

    // 2. Делаем POST запрос на официальный URL без ручных склеек строк и query-знаков
    const response = await axios.post(
      'https://stt.api.cloud.yandex.net/speech/v1/stt:recognize',
      rawPcmBuffer, // Передаем чистый поток LPCM (без заголовков WAV)
      {
        // Axios автоматически добавит эти параметры в конец URL по всем правилам веб-стандартов
        params: {
          folderId: YANDEX_FOLDER_ID,
          lang: 'ru-RU',
          topic: 'general',
          format: 'lpcm', // Жестко отключаем дефолтный OggOpus Яндекса
          sampleRateHertz: '16000', // Указываем частоту дискретизации вашего фронтенд-хука
          profanityFilter: 'false',
          rawResults: 'false',
        },
        headers: {
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          'Content-Type': 'application/octet-stream', // Передача сырого бинарного потока байт
        },
      },
    )

    if (response.data && response.data.result) {
      console.log(
        '📝 [DEBUG] Успешно получен текст от Яндекса:',
        response.data.result,
      )
      return response.data.result
    }

    return ''
  } catch (error) {
    console.error(
      'Детальная ошибка Yandex SpeechKit:',
      error.response?.status,
      error.response?.data || error.message,
    )
    throw new Error('Speech recognition service error')
  }
}

const transcribeLongAudio = async (audioBuffer) => {
  // Генерируем уникальное имя файла для бакета, чтобы пользователи не перезаписывали друг друга
  const fileName = `speech_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`

  try {
    console.log(
      `📊 [Long STT] Вес входящего длинного файла: ${(audioBuffer.length / 1024).toFixed(2)} КБ`,
    )

    // ЭТАП 1: Загрузка оригинального WAV-файла в Yandex Object Storage
    console.log(
      `📂 [Long STT] Загрузка файла ${fileName} в бакет Яндекса...`,
    )
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: audioBuffer, // Загружаем оригинальный буфер целиком (с WAV заголовком, для S3 это нормально)
      ContentType: 'audio/wav',
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    // Формируем внутреннюю URI ссылку на файл, которую требует асинхронный API Яндекса
    const fileUri = `https://storage.yandexcloud.net/${BUCKET_NAME}/${fileName}`
    console.log(
      `✅ [Long STT] Файл успешно сохранен в облаке. Ссылка: ${fileUri}`,
    )

    // ЭТАП 2: Инициализация асинхронной задачи распознавания
    console.log(
      '🔄 [Long STT] Создание асинхронной задачи в Yandex SpeechKit...',
    )
    const startUrl =
      'https://transcribe.api.cloud.yandex.net/speech/stt/v2/longRunningRecognize'

    const requestBody = {
      config: {
        specification: {
          languageCode: 'ru-RU',
          model: 'general',
          audioEncoding: 'LINEAR16_PCM', // Формат WAV из вашего фронтенд-хука
          sampleRateHertz: 16000, // Частота 16kHz из вашего фронтенд-хука
          profanityFilter: false,
          rawResults: false,
        },
      },
      audio: {
        uri: fileUri, // Передаем ссылку на бакет вместо base64 контента!
      },
    }

    const startResponse = await axios.post(startUrl, requestBody, {
      headers: {
        Authorization: `Api-Key ${YANDEX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const operationId = startResponse.data?.id
    if (!operationId) {
      throw new Error(
        `Яндекс не вернул ID операции. Ответ: ${JSON.stringify(startResponse.data)}`,
      )
    }

    console.log(
      `🆔 [Long STT] Задача создана. ID Операции: ${operationId}. Опрашиваем статус...`,
    )

    // ЭТАП 3: Механизм поллинга (проверка готовности результатов)
    const checkUrl = `https://operation.api.cloud.yandex.net/operations/${operationId}

`
    const maxAttempts = 40
    let attempts = 0
    let recognizedText = ''

    while (attempts < maxAttempts) {
      attempts++
      await delay(2000) // Опрашиваем Яндекс каждые 2 секунды

      const checkResponse = await axios.get(checkUrl, {
        headers: { Authorization: `Api-Key ${YANDEX_API_KEY}` },
      })

      const taskData = checkResponse.data

      // done === true означает, что Яндекс закончил распознавание текста
      if (taskData.done === true) {
        console.log(
          `✅ [Long STT] Расшифровка завершена Яндексом на попытке №${attempts}!`,
        )

        // Собираем текст из чанков (кусочков) ответа
        const chunks = taskData.response?.chunks || []
        recognizedText = chunks
          .map((chunk) => chunk.alternatives?.[0]?.text || '')
          .filter(Boolean)
          .join(' ')

        break // Выходим из цикла опроса
      }

      console.log(
        `⏳ [Long STT] Яндекс обрабатывает аудио (Попытка ${attempts})...`,
      )
    }

    if (!recognizedText && attempts >= maxAttempts) {
      throw new Error(
        'Превышено время ожидания ответа от асинхронного сервиса Яндекса',
      )
    }
    
    return recognizedText.trim()
  } catch (error) {
    console.error(
      'Ошибка в асинхронном Yandex SpeechKit:',
      error.response?.data || error.message,
    )
    
    throw new Error('Long speech recognition service error')
  } finally {
    // ЭТАП 4: ЖЕЛЕЗОБЕТОННАЯ ОЧИСТКА ХРАНИЛИЩА (выполняется в любом случае, даже при ошибке)
    // Удаляем временный файл из бакета, чтобы не платить за хранение лишних мегабайт
    try {
      console.log(
        `🧹 [Long STT] Удаление временного файла ${fileName} из бакета...`,
      )
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileName,
        }),
      )
      console.log('✨ [Long STT] Бакет успешно очищен.')
    } catch (cleanupError) {
      console.error(
        '⚠️ Ошибка при удалении файла из бакета:',
        cleanupError.message,
      )
    }
  } 
}

export { transcribeShortAudio, transcribeLongAudio }
