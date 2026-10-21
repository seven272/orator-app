import gigachatAxiosClient from './gigachatAxiosClient.js' // ваш существующий клиент

/**
 * Универсальный метод для отправки запросов в GigaChat
 * @param {Array} messages - Массив сообщений [{role: 'system', content: '...'}, {role: 'user', content: '...'}]
 * @param {number} maxTokens - Максимальное количество токенов (по умолчанию 700)
 * @returns {Promise<Object>} Данные ответа от модели
 */
const sendGigaChatRequest = async (
  messages,
  maxTokens = 700,
  temperature = null,
  responseFormat = null,
) => {
  try {
    const model =
      process.env.GIGACHAT_MODEL_NAME || 'GigaChat-3-Ultra'

    // Базовый payload запроса
    const requestPayload = {
      model,
      messages,
      max_tokens: maxTokens,
    }

    // Если передана схема структурированного JSON — подмешиваем её в запрос
    if (temperature) {
      requestPayload.temperature = temperature
    }

    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      requestPayload,
    )
    const content = response.data?.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('Получен пустой ответ от GigaChat API')
    }

    return content
  } catch (error) {
    console.error(`[GigaChat Error]:`, error.message)
    throw error
  }
}

export { sendGigaChatRequest }
