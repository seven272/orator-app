import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

import User from '../models/User.js'
import createToken from '../utils/createToken.js'
import {
  SKILLS_MAP,
  EXERCISE_MAX_POINTS,
} from '../constants/skills.js'
import { getXpThreshold } from '../utils/fnForControllers.js'

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
    // Пароль вообще не достаем из базы
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    return res.status(200).json({ user })
  } catch (error) {
    console.log(error)
    res.status(401).json({ message: 'Нет доступа' })
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
          message: 'Этот email уже занят другим оратором. Хотите объединить профили?',
          vkOwnerId: isEmailTaken._id // Передаем ID аккаунта-дубликата для слияния
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

// Авторизация и регистрация через ВКонтакте
const vkAuth = async (req, res) => {
  try {
    // Получаем vkId из middleware verifyVkSignature
    const vkId = String(req.vkId)

    // Фронтенд передает эти данные из VK Bridge при первом запуске
    const { firstName, lastName, avatar, registeredFrom } = req.body

    // 1. Ищем пользователя в базе по vkId
    let user = await User.findOne({ vkId })

    // Флаг, чтобы понять, новая это регистрация или вход
    let isNewUser = false

    // 2. Если пользователя нет — создаем новый аккаунт (Регистрация)
    if (!user) {
      isNewUser = true

      // Формируем красивый дефолтный никнейм на основе vkId
      const defaultDisplayName = `vk_user_${vkId.slice(-6)}`

      user = await User.create({
        vkId,
        firstName: firstName || 'Имя',
        lastName: lastName || 'Фамилия',
        displayName: defaultDisplayName,
        avatar: avatar || 'dicebear.com',
        authProvider: 'vk',
        // Если передан registeredFrom (vk или android), пишем его, иначе дефолт 'vk'
        registeredFrom: registeredFrom || 'vk',

        // Сохраняем оригинальные данные соцсети на будущее
        socialProfilesData: {
          vk: {
            firstName: firstName || '',
            lastName: lastName || '',
            avatar: avatar || '',
          },
        },
      })
    }

    // 3. Создаем токен для пользователя
    // Вызываем вашу функцию, которая установит куку или сгенерирует JWT
    createToken(res, user._id)

    // 4. Убираем чувствительные данные перед отправкой
    const userResponse = user.toObject()
    delete userResponse.password

    res.status(isNewUser ? 201 : 200).json({
      user: userResponse,
      message: isNewUser
        ? 'Регистрация через VK успешна'
        : 'Вы вошли через VK',
    })
  } catch (error) {
    console.error('Ошибка в vkAuth:', error)
    res.status(500).json({
      message: 'Ошибка сервера при авторизации через ВКонтакте',
    })
  }
}

// Привязка Email и Пароля к существующему аккаунту (например, созданному через VK)
const linkEmailToVkAccount = async (req, res) => {
  try {
    const userId = req.userId
    const { email, password } = req.body

    // 1. Валидация входных данных
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email и пароль обязательны для привязки',
      })
    }

    const targetEmail = email.toLowerCase().trim()

    // 2. Проверяем, не занят ли этот Email КЕМ-ТО ДРУГИМ в базе данных
    const emailOwner = await User.findOne({ email: targetEmail })

    if (emailOwner) {
      // КРИТИЧЕСКИЙ СЦЕНАРИЙ: Email уже существует в системе
      if (String(emailOwner._id) === String(userId)) {
        return res.status(400).json({
          message: 'Этот Email уже привязан к вашему аккаунту',
        })
      }

      // Если ID разные, значит это конфликт: у юзера два раздельных аккаунта.
      // Возвращаем специальный статус или код ошибки для фронтенда
      return res.status(409).json({
        code: 'EMAIL_ALREADY_TAKEN',
        message:
          'Пользователь с таким Email уже существует. Хотите объединить профили?',
      })
    }

    // 3. Проверяем текущего пользователя: возможно, у него уже есть почта
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return res
        .status(404)
        .json({ message: 'Текущий пользователь не найден' })
    }

    if (currentUser.email) {
      return res.status(400).json({
        message:
          'К вашему аккаунту уже привязана почта. Смена почты происходит в другом меню',
      })
    }

    // 4. Хэшируем пароль и обновляем документ
    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    currentUser.email = targetEmail
    currentUser.password = hashedPassword

    // Если пользователь изначально зашел через VK, но теперь добавил почту,
    // мы можем оставить authProvider: 'vk' (как исторический факт), либо не менять его.
    await currentUser.save()

    // 5. Возвращаем обновленного пользователя (без пароля)
    const userResponse = currentUser.toObject()
    delete userResponse.password

    res.status(200).json({
      user: userResponse,
      message:
        'Email и пароль успешно привязаны! Теперь вы можете входить через сайт.',
    })
  } catch (error) {
    console.error('Ошибка в linkEmailToVkAccount:', error)
    res.status(500).json({
      message: 'Ошибка сервера при привязке Email',
    })
  }
}

// Привязка VK ID к существующему Email-аккаунту сайта
const linkVkToEmailAccount = async (req, res) => {
  try {
    const userId = req.userId // Из checkAuth
    const vkId = String(req.vkId) // Из vkLaunchParamsAuth

    // 1. Проверяем, не привязан ли этот vkId КЕМ-ТО ДРУГИМ в базе
    const vkOwner = await User.findOne({ vkId })

    if (vkOwner) {
      // Сценарий конфликта: этот VK профиль уже зарегистрирован как отдельный аккаунт
      if (String(vkOwner._id) === String(userId)) {
        return res.status(400).json({
          message:
            'Этот аккаунт ВКонтакте уже привязан к вашему профилю',
        })
      }

      // Если ID разные, отдаем статус конфликта 409
      return res.status(409).json({
        code: 'VK_ALREADY_TAKEN',
        message:
          'Этот профиль ВКонтакте уже привязан к другому аккаунту. Хотите объединить их прогресс?',
        vkOwnerId: vkOwner._id, // Пригодится фронтенду для подтверждения слияния
      })
    }

    // 2. Ищем текущего пользователя сайта
    const currentUser = await User.findById(userId)
    if (!currentUser) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    // Проверяем, нет ли уже у него привязанного VK
    if (currentUser.vkId) {
      return res.status(400).json({
        message:
          'К вашему профилю уже привязан другой аккаунт ВКонтакте.',
      })
    }

    // 3. Записываем vkId в профиль пользователя сайта
    currentUser.vkId = vkId

    // Опционально: если у пользователя на сайте нет аватара или имени,
    // можно подтянуть их из данных VK, которые проверил бэкенд (если фронтенд передал их в body)
    const { firstName, lastName, avatar } = req.body
    if (firstName && !currentUser.firstName)
      currentUser.firstName = firstName.trim()
    if (lastName && !currentUser.lastName)
      currentUser.lastName = lastName.trim()
    if (avatar && currentUser.avatar === 'dicebear.com')
      currentUser.avatar = avatar.trim()

    await currentUser.save()

    // 4. Возвращаем обновленный профиль
    const userResponse = currentUser.toObject()
    delete userResponse.password

    res.status(200).json({
      user: userResponse,
      message:
        'Аккаунт ВКонтакте успешно привязан! Теперь вы можете входить через VK на любой платформе.',
    })
  } catch (error) {
    console.error('Ошибка в linkVkToEmailAccount:', error)
    res.status(500).json({
      message: 'Ошибка сервера при привязке ВКонтакте',
    })
  }
}

// Финальное слияние аккаунтов по выбору пользователя (Подход Поглощения)
const mergeAccounts = async (req, res) => {
  try {
    const currentUserId = req.userId // Из checkAuth
    const { targetUserId, chosenPlatform } = req.body

    if (!targetUserId || !chosenPlatform) {
      return res.status(400).json({
        message:
          'Не переданы ID целевого аккаунта или выбор платформы',
      })
    }

    if (!['current', 'target'].includes(chosenPlatform)) {
      return res
        .status(400)
        .json({ message: 'Неверный формат выбора платформы' })
    }

    // 1. Находим оба аккаунта в базе данных
    const currentAccount = await User.findById(currentUserId)
    const targetAccount = await User.findById(targetUserId)

    if (!currentAccount || !targetAccount) {
      return res.status(404).json({
        message:
          'Один из аккаунтов для слияния не найден в базе данных',
      })
    }

    // 2. Логика поглощения
    if (chosenPlatform === 'current') {
      // Пользователь оставляет ТЕКУЩИЙ прогресс.
      // Нам нужно забрать из конфликтующего аккаунта только его авторизационные ключи, которых нет у текущего.
      if (targetAccount.vkId && !currentAccount.vkId)
        currentAccount.vkId = targetAccount.vkId
      if (targetAccount.googleId && !currentAccount.googleId)
        currentAccount.googleId = targetAccount.googleId
      if (targetAccount.email && !currentAccount.email) {
        currentAccount.email = targetAccount.email
        currentAccount.password = targetAccount.password // Переносим хэш пароля
      }

      // Сохраняем обновленный текущий аккаунт
      await currentAccount.save()

      // Полностью удаляем конфликтующий (второстепенный) аккаунт
      await User.findByIdAndDelete(targetUserId)

      const userResponse = currentAccount.toObject()
      delete userResponse.password

      return res.status(200).json({
        user: userResponse,
        message:
          'Аккаунты успешно объединены! Сохранен текущий прогресс.',
      })
    } else {
      // Пользователь выбрал СОХРАНИТЬ ПРОГРЕСС ИЗ КОНФЛИКТУЮЩЕГО аккаунта.
      // Теперь targetAccount становится главным, и мы отдаем ему ключи от текущего.
      if (currentAccount.vkId && !targetAccount.vkId)
        targetAccount.vkId = currentAccount.vkId
      if (currentAccount.googleId && !targetAccount.googleId)
        targetAccount.googleId = currentAccount.googleId
      if (currentAccount.email && !targetAccount.email) {
        targetAccount.email = currentAccount.email
        targetAccount.password = currentAccount.password
      }

      // Сохраняем обновленный целевой аккаунт
      await targetAccount.save()

      // Удаляем текущий аккаунт, так как его игровой прогресс больше не нужен
      await User.findByIdAndDelete(currentUserId)

      // КРИТИЧЕСКИЙ МОМЕНТ: Так как текущий аккаунт удален, старая сессия (кука/JWT) больше не валидна!
      // Нам нужно выдать пользователю НОВЫЙ токен для его нового главного аккаунта.
      createToken(res, targetAccount._id)

      const userResponse = targetAccount.toObject()
      delete userResponse.password

      return res.status(200).json({
        user: userResponse,
        message:
          'Аккаунты успешно объединены! Восстановлен ваш старый прогресс.',
      })
    }
  } catch (error) {
    console.error('Ошибка при слиянии аккаунтов:', error)
    res
      .status(500)
      .json({ message: 'Ошибка сервера при объединении профилей' })
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

export {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  vkAuth,
  linkEmailToVkAccount,
  linkVkToEmailAccount,
  mergeAccounts,
  getUserProfile,
}
