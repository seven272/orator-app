// Короткая дата для карточки списка: "15 декабря"
const formatEventShortDate = (isoDate) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })
}

// Полная дата для детальной страницы: "15 декабря 2026 г."
const formatEventFullDate = (isoDate) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// Время начала: "19:00"
const formatEventTime = (isoDate) => {
  if (!isoDate) return ''
  return new Date(isoDate).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Проверка, закончилось ли уже мероприятие (с учетом длительности)
const isEventPast = (startDate, durationMinutes = 90) => {
  if (!startDate) return false
  const startMs = new Date(startDate).getTime()
  const endMs = startMs + Number(durationMinutes) * 60 * 1000
  return Date.now() > endMs
}

export {
  isEventPast,
  formatEventTime,
  formatEventFullDate,
  formatEventShortDate,
}
