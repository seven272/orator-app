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
    'course_rhetoric_base', 'course_negotiations', 'course_public_speech', 
    'course_storytelling', 'course_charisma', 'course_debates', 
    'course_voice_tech', 'course_persuasion'
  ]

  // --- ВЕТКА 1: Обычный приз — Средний мешок монет (35% шанс, roll от 0 до 35) ---
  if (roll < 35) {
    return {
      type: 'coins',
      amount: 500,
      title: '500 жетонов оратора'
    }
  } 
  
  // --- ВЕТКА 2: Полезный приз — Один из купонов на ИИ-тренажеры (30% шанс, roll от 35 до 65) ---
  if (roll < 65) {
    const tickets = ['ticket_ai-poem-rap', 'ticket_ai-bargain', 'ticket_ai-historical-battle']
    const randomTicketCode = tickets[Math.floor(Math.random() * tickets.length)]
    
    // Подтягиваем название из базы, чтобы на фронтенде всё отображалось корректно
    const shopItem = await ShopItem.findOne({ code: randomTicketCode })
    
    return {
      type: 'item',
      code: randomTicketCode,
      title: shopItem?.title || 'Купон на ИИ-тренажер'
    }
  } 
  
  // --- ВЕТКА 3: Ценный приз — Большой клад или Premium на 1 час (20% шанс, roll от 65 до 85) ---
  if (roll < 85) {
    if (Math.random() > 0.5) {
      return {
        type: 'coins',
        amount: 1000,
        title: '1 000 жетонов оратора'
      }
    } else {
      return {
        type: 'premium',
        amountHours: 1,
        title: 'Premium статус (1 час)'
      }
    }
  } 

  // --- ВЕТКА 4: СУПЕР-ПРИЗ — Случайный обучающий курс (15% шанс, roll от 85 до 100) ---
  // Фильтруем только те курсы, которые пользователь ЕЩЕ НЕ КУПИЛ
  const availableCourses = allCourses.filter(
    (courseCode) => !user.activePurchasedCourses.includes(courseCode)
  )

  if (availableCourses.length > 0) {
    const randomCourseCode = availableCourses[Math.floor(Math.random() * availableCourses.length)]
    
    const courseNames = {
      course_rhetoric_base: '«Базовая риторика»',
      course_negotiations: '«Жесткие переговоры»',
      course_public_speech: '«Публичные выступления»',
      course_storytelling: '«Искусство сторителлинга»',
      course_charisma: '«Харизма и юмор»',
      course_debates: '«Дебаты и споры»',
      course_voice_tech: '«Техника и постановка речи»',
      course_persuasion: '«Психология убеждения»'
    }

    return {
      type: 'course',
      code: randomCourseCode,
      title: `Обучающий курс ${courseNames[randomCourseCode] || randomCourseCode}`
    }
  }

  // Альтернативный супер-джекпот, если вообще все 8 курсов у пользователя уже открыты
  return {
    type: 'coins',
    amount: 2000,
    title: 'Джекпот: 2 000 жетонов оратора'
  }
}

export { generateWeeklySuperPrize }
