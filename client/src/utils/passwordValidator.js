/**
 * Универсальный валидатор надежности пароля для фронтенда Govorix.ru
 * @param {string} password - Введенный пароль
 * @param {string} email - Email пользователя (опционально, для исключения совпадений)
 * @returns {Object} - { isValid: boolean, message: string | null }
 */
const validatePassword = (password, email = '') => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Пароль обязателен для заполнения',
    }
  }

  const cleanPassword = password.trim()
  const cleanEmail = email ? email.toLowerCase().trim() : ''

  // 1. Проверка длины
  if (cleanPassword.length < 6) {
    return {
      isValid: false,
      message: 'Пароль должен содержать не менее 6 символов',
    }
  }

  // 2. Блокировка шаблонных паролей
  const bannedPasswords = [
    '123456',
    '123456789',
    'qwerty',
    'password',
    'govorix',
    'govorix2026',
  ]
  if (bannedPasswords.includes(cleanPassword.toLowerCase())) {
    return {
      isValid: false,
      message:
        'Этот пароль слишком простой и предсказуемый. Придумайте другой.',
    }
  }

  // 3. Блокировка совпадения пароля с началом Email
  if (cleanEmail) {
    const emailPrefix = cleanEmail.split('@')[0]
    if (
      emailPrefix === cleanPassword.toLowerCase() ||
      cleanEmail === cleanPassword.toLowerCase()
    ) {
      return {
        isValid: false,
        message: 'Пароль не должен совпадать с вашим Email',
      }
    }
  }

  return { isValid: true, message: null }
}

export { validatePassword }
