import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

import User from '../models/User.js'
import createToken from '../utils/createToken.js'
import {
  SKILLS_MAP,
  EXERCISE_MAX_POINTS,
} from '../constants/skills.js'
import { getXpThreshold } from '../utils/fnForControllers.js'
import { trackPremiumPurchase } from '../utils/feedService.js'

dotenv.config()

// Регистрация пользователя
const register = async (req, res) => {
  // Простой список вопросов для проверки
  const BOT_PROTECTION = [
    {
      question: 'Сколько гласных букв в слове "Голос"?',
      answer: '2',
    },
    {
      question:
        'Противоположность слову "Громко" (наречие, 4 буквы)?',
      answer: 'тихо',
    },
    { question: '2 + 3 * 3 = ?', answer: '11' },
  ]

  const { email, password, displayName, botAnswer, questionIndex } =
    req.body

  //  Защита от ботов
  const check = BOT_PROTECTION[questionIndex]
  if (
    !check ||
    botAnswer?.toString().toLowerCase().trim() !== check.answer
  ) {
    return res.status(403).json({
      message:
        'Защита от ботов: неверный ответ на проверочный вопрос.',
    })
  }

  try {
    // Проверка по email (ключевое поле для этого типа входа)
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(402).json({
        message: 'Пользователь с таким email уже существует',
      })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    const newUser = await User.create({
      email,
      displayName: displayName || email.split('@')[0], // Дефолтное имя из email
      password: hashedPassword,
      // Остальные поля (progression, streak) создадутся по дефолту из схемы
    })

    createToken(res, newUser._id)

    // Не отправляем пароль на фронтенд
    const userResponse = newUser.toObject()
    delete userResponse.password

    res.json({
      user: userResponse,
      message: 'Регистрация прошла успешно',
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка при регистрации пользователя' })
  }
}
// Вход пользователя
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Ищем по email
    const user = await User.findOne({ email })

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Проверяем наличие пароля (на случай, если аккаунт создан через ВК без пароля)
    if (!user.password) {
      return res.status(400).json({
        message:
          'Для этого аккаунта не установлен пароль. Войдите через соцсети',
      })
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    )

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Неверный пароль' })
    }

    createToken(res, user._id)

    // Удаляем пароль из объекта перед отправкой
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(201).json({
      user: userResponse,
      message: 'Вы вошли в систему',
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при авторизации' })
  }
}
const logout = async (req, res) => {
  // Название куки должно совпадать с тем, что в createToken
  res.cookie('jwt-oratory', '', {
    httpOnly: true,
    expires: new Date(0),
  })

  return res.status(201).json({ message: 'Вы вышли из системы' })
}
//get me
const getMe = async (req, res) => {
  try {
    // Если токена нет (аноним на сайте) или это гость — просто отдаем user: null
    if (!req.userId || req.isGuest) {
      return res.status(200).json({
        success: true,
        user: null, // Redux поймет, что активной сессии в БД нет
        message: 'Пользователь не авторизован в СУБД'
      })
    }

    // Если есть реальный userId — достаем полноценного юзера из MongoDB
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(200).json({
        success: true,
        user: null
      })
    }

    return res.status(200).json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Ошибка в контроллере getMe:', error)
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при проверке сессии',
    })
  }
}

// Обновление профиля пользователя
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId
    const { firstName, lastName, displayName, avatar, email } =
      req.body

    // 1. Формируем объект для обновления
    const updateData = {}
    if (firstName !== undefined)
      updateData.firstName = firstName.trim()
    if (lastName !== undefined) updateData.lastName = lastName.trim()
    if (avatar !== undefined) updateData.avatar = avatar.trim()

    // 2. Если пользователь хочет изменить никнейм (displayName)
    if (displayName) {
      const cleanDisplayName = displayName.trim()

      // Проверяем, не занят ли ник кем-то другим
      const isNicknameTaken = await User.findOne({
        displayName: cleanDisplayName,
        _id: { $ne: userId }, // Исключаем самого себя из поиска
      })

      if (isNicknameTaken) {
        return res.status(400).json({
          message: 'Этот никнейм уже занят другим оратором',
        })
      }

      updateData.displayName = cleanDisplayName
    }

    // 2. Если пользователь хочет изменить никнейм (displayName)
    if (email) {
      const cleanEmail = email.trim()

      // Проверяем, не занят ли ник кем-то другим
      const isEmailTaken = await User.findOne({
        email: cleanEmail,
        _id: { $ne: userId }, // Исключаем самого себя из поиска
      })

      if (isEmailTaken) {
        // Возвращаем 409 статус конфликта для активации модалки слияния
        return res.status(409).json({
          code: 'EMAIL_ALREADY_TAKEN',
          message:
            'Этот email уже занят другим оратором. Хотите объединить профили?',
          vkOwnerId: isEmailTaken._id, // Передаем ID аккаунта-дубликата для слияния
        })
      }

      updateData.email = cleanEmail
    }

    // 3. Обновляем пользователя в базе данных
    // { new: true } возвращает уже обновленный документ, runValidators запускает проверки схемы
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select('-password')

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // 4. Возвращаем обновленные данные
    res.status(200).json({
      user: updatedUser,
      message: 'Профиль успешно обновлен',
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: 'Ошибка сервера при обновлении профиля',
    })
  }
}

// Авторизация через ВКонтакте
 const vkAuth = async (req, res) => {
  try {
    const currentVkId = String(req.vkId)
    const { vkParamsData } = req

    // 1. Ищем, существует ли уже жестко зарегистрированный аккаунт
    const existingUser = await User.findOne({ vkId: currentVkId })

    if (existingUser) {
      // Пользователь уже активен — выставляем постоянную куку
      createToken(res, existingUser._id)

      const userResponse = existingUser.toObject()
      delete userResponse.password

      return res.status(200).json({
        success: true,
        isGuest: false,
        user: userResponse,
        message: 'С возвращением в Govorix!',
      })
    }

    // 2. ЮЗЕРА НЕТ В БАЗЕ -> РЕЖИМ ГОСТЯ
    // Базу данных НЕ ТРОГАЕМ. Выдаем гостевую куку на 3 дня через утилиту.
    const guestData = { vkId: currentVkId, vkParamsData }
    createToken(res, null, guestData)

    // Возвращаем пустой user: null, но сохраняем флаг isGuest: true для Header
    return res.status(200).json({
      success: true,
      isGuest: true, // 👈 Передаем, чтобы Header показал кнопку "Создать аккаунт"
      user: null,    // 👈 Больше никакого визуального шума и огромных объектов!
      message: 'Вход в гостевом режиме ВКонтакте. Ожидание регистрации.'
    })

  } catch (error) {
    console.error('Ошибка в vkAuth контроллере:', error)
    return res.status(500).json({ success: false, message: 'Ошибка сервера при авторизации VK' })
  }
}
// регистрация через ВКонтакте
 const vkRegister = async (req, res) => {
  try {
    const currentVkId = String(req.vkId)
    const { vkParamsData } = req

    // Подстраховка: проверяем, не создали ли аккаунт ранее
    let user = await User.findOne({ vkId: currentVkId })

    if (!user) {
      // Генерируем случайный никнейм Спикер#7284
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const generateNickname = `${vkParamsData?.firstName || 'Спикер'}#${randomDigits}`

      // Создаем запись в базе
      user = await User.create({
        displayName: generateNickname,
        firstName: vkParamsData?.firstName || '',
        lastName: vkParamsData?.lastName || '',
        avatar: vkParamsData?.avatar || '',
        vkId: currentVkId,
        authProvider: 'vk',
        registeredFrom: 'vk',
        socialProfilesData: {
          vk: {
            firstName: vkParamsData?.firstName || '',
            lastName: vkParamsData?.lastName || '',
            avatar: vkParamsData?.avatar || '',
          }
        }
      })
    }

    // Выдаем ПОСТОЯННУЮ куку взамен гостевой
    createToken(res, user._id)

    const userResponse = user.toObject()
    delete userResponse.password

    return res.status(201).json({
      success: true,
      isGuest: false, // Флаг гостя гаснет!
      user: userResponse,
      message: 'Профиль ВКонтакте успешно зарегистрирован в MongoDB!',
    })
  } catch (error) {
    console.error('Ошибка в контроллере vkRegister:', error)
    return res.status(500).json({ success: false, message: 'Ошибка сервера при создании профиля VK' })
  }
}

// Привязка Email и Пароля к существующему аккаунту (например, созданному через VK)
const linkEmailToVkAccount = async (req, res) => {
  try {
    const { email, password } = req.body
    
    // Получаем текущего пользователя из СУБД (подтянутого через мидлвар checkAuth / optionalAuth)
    const currentUser = req.user

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не идентифицирован в системе'
      })
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны для заполнения'
      })
    }

    const cleanEmail = email.toLowerCase().trim()

    // 1. ПРОВЕРКА НА КОНФЛИКТ: Ищем, не занята ли эта почта другим аккаунтом сайта
    const userWithThisEmail = await User.findOne({ email: cleanEmail })

    if (userWithThisEmail) {
      // Если ID совпадают, значит почта уже привязана к ЭТОМУ ЖЕ аккаунту
      if (String(userWithThisEmail._id) === String(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message: 'Этот Email уже привязан к вашему текущему профилю'
        })
      }

      // 🔥 КРИТИЧЕСКИЙ СЦЕНАРИЙ: Почта занята другим человеком!
      // Возвращаем статус 409 и структуру конфликта, которую ждет твой authSlice
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_TAKEN',
        message: 'Пользователь с таким Email уже существует в системе Govorix.',
        targetUserId: userWithThisEmail._id // Передаем ID аккаунта сайта для последующего слияния
      })
    }

    // 2. Хешируем присланный пароль
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    // 3. Безопасно обновляем текущий документ в MongoDB
    currentUser.email = cleanEmail
    currentUser.password = hashedPassword
    
    // Если основной провайдер был vk, мы можем оставить его, но обновить метаданные при необходимости
    await currentUser.save()

    // Удаляем конфиденциальные поля перед отправкой ответа
    const userResponse = currentUser.toObject()
    delete userResponse.password

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Email и пароль успешно привязаны к вашему профилю!'
    })

  } catch (error) {
    console.error('Ошибка в контроллере linkEmailToVkAccount:', error)
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при привязке Email'
    })
  }
}

// Привязка VK ID к существующему Email-аккаунту сайта
const linkVkToEmailAccount = async (req, res) => {
  try {
    // 📌 req.vkId и req.vkParamsData гарантированно извлечены и проверены мидлваром vkLaunchParamsAuth
    const currentVkId = String(req.vkId)
    const { vkParamsData } = req

    // Получаем текущего пользователя Сайта, подтянутого мидлваром checkAuth
    const currentUser = req.user

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован на Сайте',
      })
    }

    // 1. ПРОВЕРКА НА КОНФЛИКТ: Ищем, не привязан ли этот vkId к другому профилю в MongoDB
    const userWithThisVk = await User.findOne({ vkId: currentVkId })

    if (userWithThisVk) {
      // Если это тот же самый пользователь, значит VK уже привязан к этому Email
      if (String(userWithThisVk._id) === String(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message: 'Этот аккаунт ВКонтакте уже привязан к вашему профилю',
        })
      }

      // 🔥 КРИТИЧЕСКИЙ СЦЕНАРИЙ: Этот VK ID уже занят другим аккаунтом в базе!
      // Возвращаем статус 409 и структуру, которую ждет твой extraReducer в authSlice
      return res.status(409).json({
        success: false,
        code: 'VK_ALREADY_TAKEN',
        message: 'Этот аккаунт ВКонтакте уже связан с другим профилем Govorix.ru.',
        vkOwnerId: userWithThisVk._id // Передаем ID владельца ВК для слияния профилей
      })
    }

    // 2. Проверяем, нет ли у текущего пользователя уже какого-то привязанного vkId
    if (currentUser.vkId) {
      return res.status(400).json({
        success: false,
        message: 'К вашему профилю уже привязан другой аккаунт ВКонтакте. Сначала отвяжите его.',
      })
    }

    // 3. Записываем данные соцсети в текущий аккаунт Сайта
    currentUser.vkId = currentVkId
    currentUser.socialProfilesData = {
      ...currentUser.socialProfilesData,
      vk: {
        firstName: vkParamsData?.firstName || '',
        lastName: vkParamsData?.lastName || '',
        avatar: vkParamsData?.avatar || '',
      }
    }

    // Если у пользователя сайта не было аватара, можем бережно установить аватар из ВК
    if (!currentUser.avatar || currentUser.avatar.trim() === '') {
      currentUser.avatar = vkParamsData?.avatar || ''
    }

    await currentUser.save()

    // Удаляем пароль из ответа перед отправкой на фронтенд
    const userResponse = currentUser.toObject()
    delete userResponse.password

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Аккаунт ВКонтакте успешно привязан к вашему профилю!',
    })

  } catch (error) {
    console.error('Ошибка в контроллере linkVkToEmailAccount:', error)
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при привязке ВКонтакте',
    })
  }
}

// Финальное слияние аккаунтов по выбору пользователя (Подход Поглощения)
const mergeAccounts = async (req, res) => {
  try {
    const { targetUserId, chosenPlatform } = req.body
    
    // Текущий пользователь из сессии (мидлвар checkAuth)
    const currentUser = req.user

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован',
      })
    }

    if (!targetUserId || !chosenPlatform) {
      return res.status(400).json({
        success: false,
        message: 'Не переданы обязательные параметры слияния (targetUserId, chosenPlatform)',
      })
    }

    // Ищем второй (конфликтующий) аккаунт в MongoDB
    const targetUser = await User.findById(targetUserId)

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Конфликтующий аккаунт не найден в базе данных',
      })
    }

    // Подстраховка от хака: нельзя объединить аккаунт сам с собой
    if (String(currentUser._id) === String(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'Невозможно объединить один и тот же аккаунт',
      })
    }

    // Итоговый объект пользователя, который останется в живых
    let finalUser = null

    // ==========================================
    // СЦЕНАРИЙ А: ОСТАВИТЬ ТЕКУЩИЙ ПРОГРЕСС
    // ==========================================
    if (chosenPlatform === 'current') {
      // Переносим социальные привязки со старого аккаунта в текущий, если их тут нет
      if (!currentUser.vkId && targetUser.vkId) {
        currentUser.vkId = targetUser.vkId
        currentUser.socialProfilesData.vk = targetUser.socialProfilesData.vk
      }
      if (!currentUser.email && targetUser.email) {
        currentUser.email = targetUser.email
        currentUser.password = targetUser.password // Переносим и хэш пароля сайта
        currentUser.socialProfilesData.google = targetUser.socialProfilesData.google
      }

      // Сохраняем текущего пользователя в MongoDB
      await currentUser.save()
      finalUser = currentUser

      // Полностью удаляем старый аккаунт, чтобы очистить sparse-индексы
      await User.findByIdAndDelete(targetUserId)
    } 
    // ==========================================
    // СЦЕНАРИЙ Б: ЗАГРУЗИТЬ СТАРЫЙ ПРОГРЕСС
    // ==========================================
    else if (chosenPlatform === 'target') {
      // Переносим привязки с текущего аккаунта в старый (target)
      if (!targetUser.vkId && currentUser.vkId) {
        targetUser.vkId = currentUser.vkId
        targetUser.socialProfilesData.vk = currentUser.socialProfilesData.vk
      }
      if (!targetUser.email && currentUser.email) {
        targetUser.email = currentUser.email
        targetUser.password = currentUser.password
        targetUser.socialProfilesData.google = currentUser.socialProfilesData.google
      }

      // Сохраняем старого пользователя
      await targetUser.save()
      finalUser = targetUser

      // Удаляем текущий временный сессионный аккаунт из базы данных
      await User.findByIdAndDelete(currentUser._id)

      // 🔥 КРИТИЧЕСКИ ВАЖНО: Так как мы физически переселились в другой документ MongoDB,
      // нам необходимо перезаписать куку jwt-oratory на новый finalUser._id!
      createToken(res, finalUser._id, null)
    } else {
      return res.status(400).json({
        success: false,
        message: 'Невалидное значение chosenPlatform. Ожидается current или target',
      })
    }

    // Удаляем пароль перед отправкой на фронтенд
    const userResponse = finalUser.toObject()
    delete userResponse.password

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Профили успешно объединены! Данные кроссплатформенности синхронизированы.',
    })

  } catch (error) {
    console.error('Ошибка в контроллере mergeAccounts:', error)
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при объединении аккаунтов',
    })
  }
}

const getUserProfile = async (req, res) => {
  const userId = req.userId
  try {
    const user = await User.findById(userId).select('-password')

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Рассчитываем прогресс текущего уровня в процентах для фронтенда
    const nextThreshold = getXpThreshold(user.progression.level)
    const levelProgressPercent = Math.round(
      (user.progression.xp / nextThreshold) * 100,
    )

    // Расчет данных для Radar Chart (Паутинка) с нормализацией по весам упражнений
    const skillsData = Object.entries(SKILLS_MAP).map(
      ([skillName, aliases]) => {
        // Фильтруем статистику упражнений, которые относятся к текущему навыку
        const relevantStats = user.stats.exerciseStats.filter((s) =>
          aliases.includes(s.alias),
        )

        let average = 0
        if (relevantStats.length > 0) {
          // 1. Считаем, сколько ВСЕГО очков набрал пользователь в этой категории
          const totalEarnedPoints = relevantStats.reduce(
            (sum, item) => sum + item.totalPoints,
            0,
          )

          // 2. Считаем, сколько МАКСИМАЛЬНО он мог набрать за все свои попытки
          const totalPossiblePoints = relevantStats.reduce(
            (sum, item) => {
              // Берем максимум из карты очков. Если вдруг упражнения нет в списке — ставим дефолт 30
              const maxForOneAttempt =
                EXERCISE_MAX_POINTS[item.alias] || 30
              // Умножаем максимальную стоимость на количество прохождений
              return sum + maxForOneAttempt * item.completionsCount
            },
            0,
          )

          // 3. Вычисляем честный процент мастерства (от 0 до 100)
          average =
            totalPossiblePoints > 0
              ? Math.round(
                  (totalEarnedPoints / totalPossiblePoints) * 100,
                )
              : 0
        }

        return {
          subject: skillName,
          A: Math.min(average, 100), // Предохранитель, чтобы значение гарантированно не превышало 100
          fullMark: 100,
        }
      },
    )
    // Определение Зоны роста (минимальный средний балл среди начатых)
    const startedSkills = Array.isArray(skillsData)
      ? skillsData.filter((s) => s.A > 0)
      : []
    let weakPoint = null
    if (startedSkills.length > 0) {
      // Находим самый низкий результат (создаем копию через [...], чтобы не испортить основной массив)
      const sorted = [...startedSkills].sort((a, b) => a.A - b.A)
      const weakest = sorted[0]
      // Формируем объект в том формате, который ожидает фронтенд
      weakPoint = {
        skill: weakest.subject,
        score: weakest.A,
        recommendation: `Твой навык "${weakest.subject}" требует внимания. Попробуй улучшить его!`,
      }
    }
    //Отслеживания прогресса выполнения ежедневных заданий
    // Собираем только уникальные даты, где есть выполненные ежедневные задачи
    const completedDays = [
      ...new Set(
        user.dailyProgress
          .filter((item) => item.isCompleted === true)
          .map((item) => item.date), // достаем строки "YYYY-MM-DD"
      ),
    ]
    res.status(200).json({
      user: {
        displayName: user.displayName,
        level: user.progression.level,
        xp: user.progression.xp,
        lifetimeXp: user.stats.lifetimeXp,
        coins: user.progression.coins,
        achievements: user.progression.achievements,
        streak: user.streak.current,
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        activePurchasedCourses: user.activePurchasedCourses,
        levelProgressPercent,
        nextThreshold,
        completed_days: completedDays,
      },
      skills: skillsData,
      weakPoint,
      recentActivity: user.stats.exerciseStats.slice(-5).reverse(), // Последние 5
      totalExercises: user.stats.totalExercises,
    })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ message: 'Ошибка при получении данных дашборда' })
  }
}

const fakeBuyPremium = async (req, res) => {
  try {
    const userId = req.user.id // Зависит от вашего middleware

    // Выставляем премиум на 30 дней вперед
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isPremium: true,
        premiumExpiresAt: expiresAt,
      }, 
      { new: true },
    )

    if (!updatedUser) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    trackPremiumPurchase(updatedUser._id);

    res.json({
      success: true,
      message: 'Премиум статус успешно активирован на 30 дней!',
      isPremium: updatedUser.isPremium,
      premiumExpiresAt: updatedUser.premiumExpiresAt,
    })
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: 'Ошибка при активации премиум-статуса' })
  }
}

export {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  vkAuth,
  vkRegister,
  linkEmailToVkAccount,
  linkVkToEmailAccount,
  mergeAccounts,
  getUserProfile,
  fakeBuyPremium,
}
