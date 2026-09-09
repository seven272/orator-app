const validateReportText = (text) => {
  const trimmed = text.trim()

  if (trimmed.length < 15) {
    return 'Отчет слишком короткий. Опишите подробнее (минимум 15 символов).'
  }

  // 1. Проверка на слишком длинные "слова" (набор букв без пробелов)
  const words = trimmed.split(/\s+/)
  const hasTooLongWord = words.some((word) => word.length > 25)
  if (hasTooLongWord) {
    return 'Текст содержит слишком длинные бессмысленные слова.'
  }

  // 2. Проверка на повторяющиеся подряд символы (aaaaaaa, ррррррр)
  if (/(.)\1{4,}/.test(trimmed)) {
    return 'Обнаружен повторяющийся набор символов.'
  }

  // 3. Проверка на разнообразие слов (если слов несколько, но они одинаковые)
  const uniqueWords = new Set(words.map((w) => w.toLowerCase()))
  if (words.length >= 3 && uniqueWords.size < 2) {
    return 'Пожалуйста, напишите осмысленный отчет, а не дублируйте слова.'
  }

  return null // Ошибок нет, текст валиден
}
export { validateReportText }
