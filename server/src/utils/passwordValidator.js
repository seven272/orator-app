/**
 * Базовая утилита для проверки надежности пароля
 * @param {string} password - Пароль для проверки
 * @param {string} email - Email пользователя (для исключения совпадений)
 * @returns {string|null} - Возвращает текст ошибки или null, если всё хорошо
 */
const validatePasswordStrength = (password, email = '') => {
  if (!password || typeof password !== 'string') {
    return 'Пароль обязателен для заполнения'
  }

  const cleanPassword = password.trim()
  const cleanEmail = email ? email.toLowerCase().trim() : ''

  // 1. Проверка длины
  if (cleanPassword.length < 6) {
    return 'Пароль должен содержать не менее 6 символов'
  }

  // 2. Блокировка самых популярных уязвимых паролей
  const bannedPasswords = [
    '123456',
    '123456789',
    'qwerty',
    'password',
    'govorix',
    'govorix2026',
  ]
  if (bannedPasswords.includes(cleanPassword.toLowerCase())) {
    return 'Этот пароль слишком простой и уязвим для взлома. Придумайте другой.'
  }

  // 3. Блокировка совпадения пароля с логином (Email)
  if (
    cleanEmail &&
    cleanEmail.split('@')[0] === cleanPassword.toLowerCase()
  ) {
    return 'Пароль не должен совпадать с вашим Email-именем'
  }

  return null // Валидация прошла успешно
}

export { validatePasswordStrength }
