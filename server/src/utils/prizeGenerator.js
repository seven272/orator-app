import ShopItem from '../models/ShopItem.js'

/**
 * Генерирует случайный приз для еженедельного сундука на основе весов
 * @param {Object} user - Документ пользователя из БД
 * @returns {Promise<Object>} Объект с типом начисления и данными приза для контроллера
 */
const generateWeeklySuperPrize = async (user) => {
  const roll = Math.random() * 100 // Случайное число от 0 до 100

  // Список всех 8 кодов курсов в системе
  const allCourses = [
    'pitch_master',
    'hr_storm',
    'self_pitch_pro',
    'party_charisma',
    'social_shield',
    'media_speaker',
    'toast_master',
    'story_master',
    'compliment_pro',
    'qa_master',
    'question_architect',
  ]

  // --- ВЕТКА 1: Обычный приз — Средний мешок монет (35% шанс, roll от 0 до 30) ---
  if (roll < 30) {
    if (Math.random() > 0.5) {
      return {
        type: 'coins',
        amount: 500,
        title: '500 жетонов оратора',
      }
    } else {
      return {
        type: 'achievement',
        code: 'favorite_fortune',
        title: 'Уникальная ачивка «Баловень фортуны»',
      }
    }
  }

  // --- ВЕТКА 2: Полезный приз — Один из купонов на ИИ-тренажеры (30% шанс, roll от 30 до 60) ---
  if (roll < 60) {
    const tickets = [
      'ticket_ai-poem-rap',
      'ticket_ai-bargain',
      'ticket_ai-historical-battle',
    ]
    const randomTicketCode =
      tickets[Math.floor(Math.random() * tickets.length)]

    // Подтягиваем название из базы, чтобы на фронтенде всё отображалось корректно
    const shopItem = await ShopItem.findOne({
      code: randomTicketCode,
    })

    return {
      type: 'item',
      code: randomTicketCode,
      title: shopItem?.title || 'Купон на ИИ-тренажер',
    }
  }

  // --- ВЕТКА 3: Ценный приз — Большой клад или Premium на 1 час (20% шанс, roll от 60 до 80) ---
  if (roll < 80) {
    if (Math.random() > 0.5) {
      return {
        type: 'coins',
        amount: 1000,
        title: '1 000 жетонов оратора',
      }
    } else {
      return {
        type: 'premium',
        amountHours: 1,
        title: 'Premium статус (1 час)',
      }
    }
  }
  // --- ВЕТКА 4: СУПЕР-ПРИЗ — Случайный обучающий курс (15% шанс, roll от 80 до 100) ---
  // Фильтруем только те курсы, которые пользователь ЕЩЕ НЕ КУПИЛ
  const availableCourses = allCourses.filter(
    (courseCode) => !user.activePurchasedCourses.includes(courseCode),
  )

  if (availableCourses.length > 0) {
    const randomCourseCode =
      availableCourses[
        Math.floor(Math.random() * availableCourses.length)
      ]

    const courseNames = {
      pitch_master: '«Питч на миллион: Как презентовать идею»',
      hr_storm: '«HR-Штурм: Искусство собеседований»',
      self_pitch_pro: '«Личный бренд: Самопрезентация на миллион»',
      party_charisma: '«Харизма нетворкинга: Свой в любой компании»',
      social_shield:
        '«Психологический щит: Ответ на агрессию и манипуляции»',
      media_speaker: '«Оратор в кадре: Магия публичных выступленийи»',
      toast_master:
        '«Король застолья: Искусство тостов и ярких речей»',
      story_master:
        '«Магия истории: искусство увлекательного рассказа»',
      compliment_pro:
        '«Сила комплимента: искусство располагать к себе»',
      qa_master: '«Искусство ответов: как не теряться на публике»',
      question_architect: '«Мастер вопросов: как управлять беседой»',
    }

    return {
      type: 'course',
      code: randomCourseCode,
      title: `Обучающий курс ${courseNames[randomCourseCode] || randomCourseCode}`,
    }
  }

  // Альтернативный супер-джекпот, если вообще все 8 курсов у пользователя уже открыты
  return {
    type: 'coins',
    amount: 2000,
    title: 'Джекпот: 2 000 жетонов оратора',
  }
}

export { generateWeeklySuperPrize }
