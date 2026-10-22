import { jsonrepair } from 'jsonrepair'

/**
 * Парсер ответов GigaChat с использованием json-repair.
 * @param {string} rawText - Сырой текстовый ответ от ИИ
 * @param {Object} defaultCriteria - Дефолтные критерии на случай сбоя
 * @returns {Object} - Распарсенный объект с полями totalScore, feedback и criteria
 */
const parseAiResponse = (rawText, defaultCriteria) => {
  const DEFAULT_SCORE = 60
  const SAFE_FEEDBACK =
    'Ваше выступление сохранено, но ИИ не смог сформировать детальный текстовый отчет из-за сбоя формата.'

  let raw = String(rawText || '').trim()

  // 1. Убираем markdown-обёртки, если есть
  raw = raw
    .replace(/^```json/g, '')
    .replace(/```$/g, '')
    .trim()

  // 2. Пытаемся найти самый первый JSON-объект по балансу скобок
  function extractFirstJsonObject(text) {
    const firstOpen = text.indexOf('{')
    if (firstOpen === -1) return null

    let depth = 0
    for (let i = firstOpen; i < text.length; i++) {
      const ch = text[i]
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          return text.substring(firstOpen, i + 1)
        }
      }
    }
    return null
  }

  const jsonCandidate = extractFirstJsonObject(raw)
  if (!jsonCandidate) {
    // Если вообще нет JSON-объекта — сразу фоллбек
    return {
      totalScore: DEFAULT_SCORE,
      feedback: SAFE_FEEDBACK,
      criteria: defaultCriteria,
    }
  }

  let evaluation = null

  try {
    // 3. json-repair «лечит» битый JSON
    const repairedJson = jsonrepair(jsonCandidate)
    evaluation = JSON.parse(repairedJson)
  } catch (e) {
    console.warn(
      '⚠️ Не удалось восстановить JSON через json-repair, пробуем фоллбек',
      e.message,
    )
  }

  // 4. Валидируем структуру результата
  if (evaluation && typeof evaluation.totalScore === 'number') {
    return {
      totalScore: evaluation.totalScore,
      feedback: evaluation.feedback || SAFE_FEEDBACK,
      criteria: evaluation.criteria || defaultCriteria,
    }
  }

  // 5. Фоллбек: вытаскиваем данные регулярками из исходного текста
  const scoreMatch = raw.match(/totalScore\s*[:=]\s*([\d.]+)/i)
  const feedbackMatch =
    raw.match(/"feedback"\s*:\s*"([^"]*)"/i) ||
    raw.match(/feedback[:=]\s*"([^"]*)"/i)

  const totalScore = scoreMatch
    ? parseFloat(scoreMatch[1])
    : DEFAULT_SCORE
  let feedback = feedbackMatch ? feedbackMatch[1] : SAFE_FEEDBACK

  feedback = feedback
    .replace(/[«»"]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  return {
    totalScore: isNaN(totalScore) ? DEFAULT_SCORE : totalScore,
    feedback,
    criteria: defaultCriteria,
  }
}

export { parseAiResponse }
