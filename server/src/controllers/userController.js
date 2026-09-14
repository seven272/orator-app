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
import { translit } from '../utils/transliterate.js'
import { validatePasswordStrength } from '../utils/passwordValidator.js'

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

    const passwordError = validatePasswordStrength(password, email)

    if (passwordError) {
      return res
        .status(400)
        .json({ success: false, message: passwordError })
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
    if (!req.userId || req.isVkGuest) {
      return res.status(200).json({
        success: true,
        user: null, // Redux поймет, что активной сессии в БД нет
        message: 'Пользователь не авторизован в СУБД',
      })
    }

    // Если есть реальный userId — достаем полноценного юзера из MongoDB
    const user = await User.findById(req.userId).select('-password')

    if (!user) {
      return res.status(200).json({
        success: true,
        user: null,
      })
    }

    return res.status(200).json({
      success: true,
      user,
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

    // 🔥 Теперь деструктурируем password (новый пароль) из тела запроса
    const {
      firstName,
      lastName,
      displayName,
      avatar,
      email,
      password,
    } = req.body

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

    // 3. Если пользователь хочет изменить Email (или привязать его через форму редактирования)
    if (email) {
      const cleanEmail = email.toLowerCase().trim()

      // Проверяем, не занята ли почта кем-то другим
      const isEmailTaken = await User.findOne({
        email: cleanEmail,
        _id: { $ne: userId }, // Исключаем самого себя из поиска
      })

      if (isEmailTaken) {
        // 🔥 ИСПРАВЛЕНО: Меняем ключ на targetUserId для синхронизации со структурой authSlice
        return res.status(409).json({
          code: 'EMAIL_ALREADY_TAKEN',
          message:
            'Этот email уже занят другим оратором. Хотите объединить профили?',
          targetUserId: isEmailTaken._id,
        })
      }

      updateData.email = cleanEmail
    }

    // 🔥 4. НОВАЯ ЛОГИКА: Если пользователь ввел новый пароль
    if (password && password.trim() !== '') {
      const passwordError = validatePasswordStrength(
        password,
        email || req.user?.email,
      )

      if (passwordError) {
        return res.status(400).json({ message: passwordError })
      }
      // Хешируем пароль перед записью в базу данных
      const salt = bcrypt.genSaltSync(10)
      const hashedPassword = bcrypt.hashSync(password, salt)

      updateData.password = hashedPassword
    }

    // 5. Обновляем пользователя в базе данных
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

    // 6. Возвращаем обновленные данные
    res.status(200).json({
      user: updatedUser,
      message: 'Профиль успешно обновлен',
    })
  } catch (error) {
    console.error('Ошибка в контроллере updateProfile:', error)
    res.status(500).json({
      message: 'Ошибка сервера при обновлении профиля',
    })
  }
}

// Авторизация через ВКонтакте
const vkAuth = async (req, res) => {
  try {
    const currentVkId = String(req.vkId)

    // 1. Ищем, существует ли уже жестко зарегистрированный аккаунт
    const existingUser = await User.findOne({ vkId: currentVkId })

    if (existingUser) {
      // Пользователь уже активен — выставляем постоянную куку
      createToken(res, existingUser._id)

      const userResponse = existingUser.toObject()
      delete userResponse.password

      return res.status(200).json({
        success: true,
        isVkGuest: false,
        user: userResponse,
        message: 'С возвращением в Govorix!',
      })
    }

    // 2. ЮЗЕРА НЕТ В БАЗЕ -> РЕЖИМ ГОСТЯ
    // Возвращаем пустой user: null, но сохраняем флаг isVkGuest: true для Header
    return res.status(200).json({
      success: true,
      isVkGuest: true, // 👈 Передаем, чтобы Header показал кнопку "Создать аккаунт"
      user: {
        displayName: 'Гость из ВКонтакте', // 👈 Кратко и емко для Redux селекторов
        avatar: '', // Пустая строка — AvatarOrPlaceholder автоматически сделает буквенную заглушку "ГО"
      },
      message:
        'Вход в гостевом режиме ВКонтакте. Ожидание регистрации.',
    })
  } catch (error) {
    console.error('Ошибка в vkAuth контроллере:', error)
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при авторизации VK',
    })
  }
}
// регистрация через ВКонтакте
const vkRegister = async (req, res) => {
  try {
    const currentVkId = String(req.vkId) // Извлекли '145266467' из проверенной подписи

    // Фронтенд прислал объект, деструктурируем его с подстраховкой на пустые строки
    const { firstName, lastName, avatar } = req.body

    // Подстраховка: проверяем, нет ли уже юзера в базе
    let user = await User.findOne({ vkId: currentVkId })

    if (!user) {
      // 1. Сначала переводим имя в латиницу и зачищаем от лишних символов
      const latinFirstName = translit(firstName)

      // 2. Если имя корректное — берем его, если пустое — подставляем дефолтный латинский корень
      const cleanFirstName =
        latinFirstName && latinFirstName.trim() !== ''
          ? latinFirstName.trim()
          : 'Speaker'

      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const generateNickname = `${cleanFirstName}#${randomDigits}`

      // Создаем запись в базе данных MongoDB
      user = await User.create({
        displayName: generateNickname,
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: avatar || '', // Если пришла пустая строка, запишется '', и Хедер покажет красивую буквенную заглушку!
        vkId: currentVkId,
        authProvider: 'vk',
        registeredFrom: 'vk',
        socialProfilesData: {
          vk: {
            firstName: firstName || '',
            lastName: lastName || '',
            avatar: avatar || '',
          },
        },
      })
    }

    // Выдаем ПОСТОЯННУЮ куку взамен гостевой
    createToken(res, user._id)

    const userResponse = user.toObject()
    delete userResponse.password

    return res.status(201).json({
      success: true,
      isGuest: false, // Флаг гостя гаснет в Redux!
      user: userResponse,
      message: 'Профиль ВКонтакте успешно зарегистрирован в MongoDB!',
    })
  } catch (error) {
    console.error('Ошибка в контроллере vkRegister:', error)
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при создании профиля VK',
    })
  }
}

// 1️⃣ Привязка Email и Пароля к существующему аккаунту (например, созданному через VK)
const linkEmailToVkAccount = async (req, res) => {
  try {
    const { email, password } = req.body
    const currentUser = req.user // Подтянуто мидлваром checkAuth / optionalAuth

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не идентифицирован в системе',
      })
    }

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email и пароль обязательны для заполнения',
      })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Проверка на конфликт индексов
    const userWithThisEmail = await User.findOne({
      email: cleanEmail,
    })

    if (userWithThisEmail) {
      if (String(userWithThisEmail._id) === String(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message:
            'Этот Email уже привязан к вашему текущему профилю',
        })
      }

      // Возвращаем 409 конфликт для активации модалки слияния в authSlice
      return res.status(409).json({
        success: false,
        code: 'EMAIL_ALREADY_TAKEN',
        message:
          'Пользователь с таком Email уже существует в системе Govorix.',
        targetUserId: userWithThisEmail._id,
      })
    }

    const passwordError = validatePasswordStrength(
      password,
      cleanEmail,
    )

    if (passwordError) {
      return res
        .status(400)
        .json({ success: false, message: passwordError })
    }

    const salt = bcrypt.genSaltSync(10)
    const hashedPassword = bcrypt.hashSync(password, salt)

    currentUser.email = cleanEmail
    currentUser.password = hashedPassword

    await currentUser.save()

    const userResponse = currentUser.toObject()
    delete userResponse.password

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Email и пароль успешно привязаны к вашему профилю!',
    })
  } catch (error) {
    console.error('Ошибка в контроллере linkEmailToVkAccount:', error)
    return res.status(500).json({
      success: false,
      message: 'Внутренняя ошибка сервера при привязке Email',
    })
  }
}

// 2️⃣ Привязка VK ID к существующему Email-аккаунту сайта
const linkVkToEmailAccount = async (req, res) => {
  try {
    const currentVkId = String(req.vkId) // Извлечено мидлваром

    // 🔥 КОРРЕКТИРОВКА: Имя, фамилию и аватар берем из req.body, как договорились ранее!
    const { firstName, lastName, avatar } = req.body
    const currentUser = req.user // Подтянуто мидлваром checkAuth

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован на Сайте',
      })
    }

    const userWithThisVk = await User.findOne({ vkId: currentVkId })

    if (userWithThisVk) {
      if (String(userWithThisVk._id) === String(currentUser._id)) {
        return res.status(400).json({
          success: false,
          message:
            'Этот аккаунт ВКонтакте уже привязан к вашему профилю',
        })
      }

      return res.status(409).json({
        success: false,
        code: 'VK_ALREADY_TAKEN',
        message:
          'Этот аккаунт ВКонтакте уже связан с другим профилем Govorix.ru.',
        vkOwnerId: userWithThisVk._id,
      })
    }

    if (currentUser.vkId) {
      return res.status(400).json({
        success: false,
        message:
          'К вашему профилю уже привязан другой аккаунт ВКонтакте.',
      })
    }

    // Записываем очищенные данные, пришедшие из VK Bridge фронтенда
    currentUser.vkId = currentVkId
    currentUser.socialProfilesData = {
      ...currentUser.socialProfilesData,
      vk: {
        firstName: firstName || '',
        lastName: lastName || '',
        avatar: avatar || '',
      },
    }

    if (!currentUser.avatar || currentUser.avatar.trim() === '') {
      currentUser.avatar = avatar || ''
    }

    await currentUser.save()

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

// 3️⃣ Финальное слияние аккаунтов (Подход Поглощения) — ПОЛНАЯ РЕАЛИЗАЦИЯ
const mergeAccounts = async (req, res) => {
  try {
    // 🔥 ТЕПЕРЬ ОБЯЗАТЕЛЬНО ТРЕБУЕМ ПАРОЛЬ ОТ КОНФЛИКТУЮЩЕГО АККАУНТА
    const { targetUserId, chosenPlatform, password } = req.body
    const currentUser = req.user // Сессионный пользователь из куки [INDEX]

    console.log(targetUserId, chosenPlatform, password)

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Пользователь не авторизован',
      })
    }

    if (!targetUserId || !chosenPlatform || !password) {
      return res.status(400).json({
        success: false,
        message:
          'Не переданы обязательные параметры слияния или неверный пароль',
      })
    }

    // Ищем второй (конфликтующий) аккаунт Сайта в MongoDB
    const targetUser = await User.findById(targetUserId)

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Конфликтующий аккаунт не найден',
      })
    }

    // 🔥 ЗАЩИТА ОТ УГОНА: Проверяем, знает ли пользователь пароль от целевого аккаунта!
    // Проверяем наличие пароля у старого аккаунта (на случай гипотетических пустых полей)
    if (!targetUser.password) {
      return res.status(400).json({
        success: false,
        message:
          'Для целевого аккаунта не установлен пароль. Слияние заблокировано из соображений безопасности.',
      })
    }

    // Сверяем хэш пароля целевого аккаунта с тем, что ввел юзер в модалке слияния [INDEX]
    const isPasswordValid = bcrypt.compareSync(
      password,
      targetUser.password,
    )

    if (!isPasswordValid) {
      return res.status(403).json({
        success: false,
        message:
          'Критическая ошибка безопасности: неверный пароль от связываемого аккаунта Сайта!',
      })
    }

    // --- ЕСЛИ ПАРОЛЬ СОВПАЛ — МЫ НА 100% УВЕРЕНЫ, ЧТО ЭТО ОДИН И ТOТ ЖЕ ЧЕЛОВЕК ---
    let finalUser = null

    // СЦЕНАРИЙ А: Оставить текущий прогресс ВК, привязав почту старого
    if (chosenPlatform === 'current') {
      if (!currentUser.vkId && targetUser.vkId) {
        currentUser.vkId = targetUser.vkId
        currentUser.socialProfilesData.vk =
          targetUser.socialProfilesData.vk
      }
      if (!currentUser.email && targetUser.email) {
        currentUser.email = targetUser.email
        currentUser.password = targetUser.password
        currentUser.socialProfilesData.google =
          targetUser.socialProfilesData.google
      }

      await currentUser.save()
      finalUser = currentUser
      await User.findByIdAndDelete(targetUserId) // Удаляем старый дубликат [INDEX]
    }
    // СЦЕНАРИЙ Б: Загрузить старый прогресс Сайта, привязав текущий VK ID [INDEX]
    else if (chosenPlatform === 'target') {
      const vkIdToMove = currentUser.vkId
      const vkSocialData = currentUser.socialProfilesData?.vk

      // 1. 🔥 ИСПРАВЛЕНО ДЛЯ MONGOOSE: Используем findByIdAndUpdate с оператором $unset,
      // чтобы намертво стереть vkId и очистить уникальный индекс у временного юзера без ошибок валидации.
      await User.findByIdAndUpdate(currentUser._id, {
        $unset: {
          vkId: '',
          'socialProfilesData.vk': '',
        },
      })

      // 2. Теперь поле vkId гарантированно свободно. Безопасно переносим привязки в старый аккаунт Сайта
      if (vkIdToMove) {
        targetUser.vkId = vkIdToMove

        // Бережно инициализируем объект socialProfilesData, если его не было
        if (!targetUser.socialProfilesData) {
          targetUser.socialProfilesData = {}
        }

        targetUser.socialProfilesData.vk = vkSocialData
      }

      // Переносим почту, если вдруг её не было в старом аккаунте
      if (!targetUser.email && currentUser.email) {
        targetUser.email = currentUser.email
        targetUser.password = currentUser.password
      }

      // 3. Сохраняем старый профиль — теперь никаких ошибок дубликатов или CastError!
      await targetUser.save()
      finalUser = targetUser

      // 4. Полностью удаляем ставший ненужным временный гостевой документ из базы
      await User.findByIdAndDelete(currentUser._id)

      // 5. Перевыпускаем куку авторизации на ID сохраненного старого (актуального) аккаунта
      createToken(res, targetUser._id, null)
    }

    const userResponse = finalUser.toObject()
    delete userResponse.password

    return res.status(200).json({
      success: true,
      user: userResponse,
      message: 'Идентификация пройдена. Профили успешно объединены!',
    })
  } catch (error) {
    console.error('Ошибка в контроллере mergeAccounts:', error)
    return res.status(500).json({
      success: false,
      message: 'Ошибка сервера при слиянии аккаунтов',
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

    trackPremiumPurchase(updatedUser._id)

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
