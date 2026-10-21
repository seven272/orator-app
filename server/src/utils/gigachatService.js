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
  temperature = 0.8,
) => {
  try {
    // Подтягиваем модель из .env, либо используем Ultra как фоллбек
    const model =
      process.env.GIGACHAT_MODEL_NAME || 'GigaChat-3-Ultra'

    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: temperature,
      },
    )
    const content = response.data?.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Получен пустой ответ от GigaChat API')
    }
    return content
  } catch (error) {
    console.error(
      `[GigaChat Error] Ошибка при запросе к модели ${process.env.GIGACHAT_MODEL_NAME}:`,
      error.message,
    )
    throw error // Пробрасываем ошибку дальше в контроллер тренажёра
  }
}

export { sendGigaChatRequest }
