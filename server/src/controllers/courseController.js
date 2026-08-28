import Course from '../models/Course.js'
import UserCourseProgress from '../models/UserCourseProgress.js'
import User from '../models/User.js'
import { checkAchievements } from '../utils/achievementService.js'
import {  IRL_CHALLENGE_PROMPTS_REGISTRY } from '../assets/prompts/irlPrompt.js'
import { EXAM_PROMPTS_REGISTRY } from '../assets/prompts/examPrompt.js'
import gigachatAxiosClient from '../utils/gigachatAxiosClient.js'
import { parseAiResponse } from '../utils/aiJsonParser.js'
import { transcribeLongAudio } from '../utils/speechService.js'
import { getXpThreshold } from '../utils/fnForControllers.js'

const getCourseProgress = async (req, res) => {
  try {
    const { courseCode } = req.params

    const userId = req.userId

    let progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })

    // Если прогресса нет, возвращаем дефолтный статус "не начат", чтобы фронтенд показал кнопку "Начать курс"
    if (!progress) {
      return res
        .status(200)
        .json({ status: 'not_started', currentBlockIndex: -1 })
    }

    res.status(200).json({ status: 'active', progress })
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при получении прогресса курса',
      error: error.message,
    })
  }
}

const startCourse = async (req, res) => {
  try {
    const { courseCode } = req.body

    const userId = req.userId

    // Проверяем существование курса

    const course = await Course.findOne({
      courseCode: courseCode,
    })
    if (!course) {
      return res.status(404).json({ message: 'Курс не найден' })
    }

    // Проверяем, нет ли уже запущенного трека по этому курсу
    const existingProgress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (existingProgress) {
      return res.status(400).json({
        message: 'Курс уже начат или завершен',
        progress: existingProgress,
      })
    }

    // 3. Создаем новую запись прогресса
    const newProgress = new UserCourseProgress({
      userId,
      courseCode,
      currentBlockIndex: 0, // Стартуем с теории
      blocksProgress: {
        theory: { isCompleted: false },
        aiWorkout: { isCompleted: false, completedExercises: [] },
        irlChallenge: { isCompleted: false },
        exam: { isCompleted: false },
      },
    })

    await newProgress.save()

    res.status(201).json({
      message: 'Курс успешно начат',
      progress: newProgress,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при старте курса',
      error: error.message,
    })
  }
}

const submitTheory = async (req, res) => {
  try {
    const { courseCode, answerIndex } = req.body
    const userId = req.userId

    //  Ищем прогресс пользователя по курсу
    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному курсу не найден' })
    }

    if (progress.currentBlockIndex !== 0) {
      return res
        .status(400)
        .json({ message: 'Вы уже прошли этот блок теории' })
    }

    //  Получаем данные квиза из модели курса
    const course = await Course.findOne({ courseCode })
    // Находим блок с типом theory (обычно он нулевой, но ищем надежно)
    const theoryBlock = course.blocks.find(
      (b) => b.blockType === 'theory',
    )

    if (
      !theoryBlock ||
      !theoryBlock.theoryConfig ||
      !theoryBlock.theoryConfig.quiz
    ) {
      return res.status(500).json({
        message:
          'Данные по верному ответу квиза отсутствуют в структуре курса',
      })
    }

    // Валидация ответа
    const correctIndex =
      theoryBlock.theoryConfig.quiz.correctAnswerIndex
    if (Number(answerIndex) !== correctIndex) {
      return res.status(400).json({
        success: false,
        message:
          'Неверный ответ. Перечитайте теорию и попробуйте снова!',
      })
    }

    // 4. Обновляем статус блока и переводим на ИИ-тренажеры (индекс 1)
    progress.blocksProgress.theory.isCompleted = true
    progress.currentBlockIndex = 1

    await progress.save()

    res.status(200).json({
      success: true,
      message: 'Тест успешно пройден! Блок теории завершен.',
      progress,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Ошибка при проверке теории',
      error: error.message,
    })
  }
}

const submitIrlReport = async (req, res) => {
  try {
    const { courseCode, textReport } = req.body
    const userId = req.userId

    // 1. Быстрая базовая валидация на сервере
    if (!courseCode) {
      return res.status(400).json({ message: 'Не указан код курса' })
    }
    if (!textReport || textReport.trim().length < 20) {
      return res.status(400).json({
        message: 'Отчет слишком короткий (минимум 20 символов).',
      })
    }

    const currentIrlPrompt = IRL_CHALLENGE_PROMPTS_REGISTRY[courseCode]

    // 2. Проверка состояния прогресса в БД
    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res.status(404).json({ message: 'Прогресс не найден' })
    }
    if (progress.currentBlockIndex < 2) {
      return res
        .status(400)
        .json({ message: 'Вы еще не дошли до IRL-челленджа.' })
    }

    let parsedResult

    // 3. Отправка отчета на жесткую цензуру в GigaChat-2
    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: currentIrlPrompt },
            {
              role: 'user',
              content: `Проанализируй этот отчет по практическому заданию "В поле":\n${textReport.trim()}`,
            },
          ],
          max_tokens: 700,
          temperature: 0.3, // Минимизирует риск галлюцинаций и сломанного JSON
        },
      )

      const aiJsonResult = response.data.choices[0].message.content

      // Парсим JSON с фолбеками на случай непредвиденных сбоев
      parsedResult = parseAiResponse(aiJsonResult, {
        isCompleted: false,
        aiFeedback:
          '⚠️ Робот-цензор не смог распознать структуру отчета. Перефразируйте текст более развернуто и попробуйте отправить снова.',
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при проверке IRL-отчета:',
        apiError.message,
      )
      return res.status(500).json({
        message:
          'Ошибка нейросети при проверке отчета. Попробуйте позже.',
      })
    }

    // 5. Запись результатов в MongoDB
    const updatedProgress = await UserCourseProgress.findOneAndUpdate(
      { userId, courseCode },
      {
        $set: {
          'blocksProgress.irlChallenge.textReport': textReport.trim(),
          'blocksProgress.irlChallenge.aiFeedback':
            parsedResult.aiFeedback,
          'blocksProgress.irlChallenge.isCompleted':
            parsedResult.isCompleted,
        },
      },
      { new: true },
    )

    // 6. Возврат актуального состояния на фронтенд
    return res.status(200).json({
      success: true,
      isReportValid: parsedResult.isCompleted,
      progressData: updatedProgress,
    })
  } catch (error) {
    console.error('Глобальная ошибка в submitIrlReport:', error)
    return res
      .status(500)
      .json({ message: 'Ошибка сервера при проверке отчета.' })
  }
}

const submitExamReport = async (req, res) => {
  try {
    const { courseCode } = req.body
    const userId = req.userId

    if (!courseCode) {
      return res.status(400).json({ message: 'Не указан код курса' })
    }

    // 💡 ДИНАМИЧЕСКИЙ ПОДБОР ПРОМПТА: вытаскиваем системный промпт из реестра по коду курса
    const currentExamPrompt = EXAM_PROMPTS_REGISTRY[courseCode]
    if (!currentExamPrompt) {
      return res
        .status(400)
        .json({
          message: `Системный промпт для курса ${courseCode} не сконфигурирован на сервере`,
        })
    }

    // 1. Находим прогресс курса в базе данных
    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному курсу не найден' })
    }

    const currentExamState = progress.blocksProgress.exam

    // 2. Валидация: не завершен ли уже курс (успех или лимит 5 попыток)
    if (
      progress.status === 'completed' ||
      currentExamState.attemptsCount >= 5
    ) {
      return res.status(400).json({
        message:
          'Обучение по этому курсу уже завершено или исчерпаны все попытки.',
      })
    }

    // 3. Валидация: проверка на активный таймаут (24 часа)
    if (
      currentExamState.lockedUntil &&
      new Date(currentExamState.lockedUntil) > new Date()
    ) {
      return res.status(423).json({
        message:
          'Экзамен заблокирован. Подождите окончания кулдауна или разблокируйте за монеты.',
      })
    }

    // 4. Расшифровка аудиозаписи монолога (используем ключ 'audio' из роута)
    let userTranscript = ''
    if (!req.file) {
      return res
        .status(400)
        .json({ message: 'Аудиофайл ответа не получен.' })
    }

    try {
      userTranscript = await transcribeLongAudio(req.file.buffer)
    } catch (speechError) {
      console.error(
        'Ошибка распознавания YandexLongSpeech на экзамене:',
        speechError,
      )
      return res.status(500).json({
        message:
          'Не удалось распознать аудиозапись экзамена. Пожалуйста, попробуйте еще раз.',
        error: speechError.message,
      })
    }

    // 5. Защита от тишины и промалчивания
    if (
      !userTranscript ||
      !userTranscript.trim() ||
      userTranscript.includes('нечего сказать')
    ) {
      return res.status(400).json({
        message:
          'Вы ничего не сказали на записи. Оценить пустой монолог невозможно. Попробуйте снова.',
      })
    }

    let parsedResult = null

    // 6. Оценка текста ответа в GigaChat-2 с подстановкой выбранного промпта
    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: currentExamPrompt }, // <-- Динамический промпт
            {
              role: 'user',
              content: `Вот расшифровка устного ответа студента для оценки:\n"${userTranscript.trim()}"`,
            },
          ],
          max_tokens: 800,
          temperature: 0.3, // Минимизируем отклонения от JSON структуры
        },
      )

      const aiJsonResult =
        response.data?.choices?.[0]?.message?.content

      // Парсим чистый JSON
      parsedResult = parseAiResponse(aiJsonResult, {
        score: 0,
        aiFeedback:
          '⚠️ Ошибка автоматической обработки результатов экзамена нейросетью. Пожалуйста, попробуйте позже.',
      })
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при оценке экзамена:',
        apiError.message,
      )
      return res.status(500).json({
        message:
          'Ошибка нейросети при проверке экзамена. Попробуйте позже.',
      })
    }

    // 7. Расчет результатов попытки
    const currentAttemptScore = parsedResult.score
    let finalAiFeedback = parsedResult.aiFeedback

    const newAttemptsCount = currentExamState.attemptsCount + 1
    const newBestScore =
      currentAttemptScore > currentExamState.bestScore
        ? currentAttemptScore
        : currentExamState.bestScore

    let isExamCompleted = currentExamState.isCompleted
    let overallCourseStatus = 'active'
    let newLockedUntil = null

    const rewardXp = 1000
    const rewardCoins = 100
    let newAnnouncedAchievements = []

    if (currentAttemptScore >= 85) {
      // === СЦЕНАРИЙ А: ЭКЗАМЕН СДАН (Баллы >= 85) ===
      if (!isExamCompleted) {
        try {
          const user = await User.findById(userId)
          if (user) {
            user.progression.xp += rewardXp
            user.stats.lifetimeXp += rewardXp
            user.weeklyXp += rewardXp
            user.progression.coins += rewardCoins

            // 🔥 АВТОМАТИЧЕСКИЙ ПЕРЕСЧЕТ УРОВНЯ («СТАКАН» ОПЫТА)
            // Цикл вычитает порог текущего уровня из накопленного опыта и апает level
            while (user.progression.xp >= getXpThreshold(user.progression.level)) {
              user.progression.xp -= getXpThreshold(user.progression.level)
              user.progression.level += 1
            }

            // Выдаем ачивку за успешное закрытие курса
            newAnnouncedAchievements = checkAchievements(
              user,
              false,
              currentAttemptScore,
              'course_master',
            )

            await user.save()
          }
        } catch (rewardError) {
          console.error(
            'Ошибка при начислении геймификации и ачивок на экзамене:',
            rewardError,
          )
        }
      }

      isExamCompleted = true
      overallCourseStatus = 'completed'
    } else {
      // === СЦЕНАРИЙ Б: ЭКЗАМЕН НЕ СДАН (Баллы < 85) ===
      if (newAttemptsCount >= 5) {
        overallCourseStatus = 'failed'
        finalAiFeedback +=
          '\n\n❌ Вы израсходовали все 5 попыток. Курс завершен неудовлетворительно.'
      } else {
        // Устанавливаем 24 часа кулдауна до следующей бесплатной попытки
        const lockDate = new Date()
        lockDate.setHours(lockDate.getHours() + 24)
        newLockedUntil = lockDate
      }
    }

    // 8. СОХРАНЕНИЕ ФИНАЛЬНЫХ РЕЗУЛЬТАТОВ В MONGODB через атомарный $set
    const updatedProgressDoc =
      await UserCourseProgress.findOneAndUpdate(
        { userId, courseCode },
        {
          $set: {
            status: overallCourseStatus,
            currentBlockIndex: 3, // Закрепляем на финальном шаге
            'blocksProgress.exam.isCompleted': isExamCompleted,
            'blocksProgress.exam.bestScore': newBestScore,
            'blocksProgress.exam.attemptsCount': newAttemptsCount,
            'blocksProgress.exam.lockedUntil': newLockedUntil,
            'blocksProgress.exam.lastAttemptScore':
              currentAttemptScore,
            'blocksProgress.exam.aiFeedback': finalAiFeedback,
          },
        },
        { new: true },
      )

    const progressResponse = updatedProgressDoc
      ? updatedProgressDoc.toObject()
      : {}

    // Обогащаем объект ответа метаданными для анимаций на фронтенде
    progressResponse.newAchievements = newAnnouncedAchievements
    progressResponse.rewards =
      currentAttemptScore >= 85
        ? { xp: rewardXp, coins: rewardCoins }
        : null

    // 9. ВЫДАЧА ИТОГОВОГО ОТВЕТА НА ФРОНТЕНД
    return res.status(200).json({
      success: true,
      user_transcript: userTranscript ? userTranscript.trim() : '',
      progressData: progressResponse,
    })
  } catch (error) {
    console.error('Глобальная ошибка в submitExamReport:', error)
    return res
      .status(500)
      .json({
        message: 'Внутренняя ошибка сервера при обработке экзамена.',
      })
  }
}

const unlockExamWithCoins = async (req, res) => {
  try {
    const { courseCode } = req.body
    const userId = req.userId
    const coinPrice = 50

    // 1. Проверяем баланс пользователя (ИСПРАВЛЕНО: смотрим внутрь progression)
    const user = await User.findById(userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    if (!user.progression || user.progression.coins < coinPrice) {
      return res.status(400).json({
        message: 'Недостаточно монет для покупки попытки.',
      })
    }

    // 2. Проверяем состояние прогресса курса (код оставляем без изменений)
    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс курса не найден' })
    }

    const exam = progress.blocksProgress.exam

    if (
      !exam.lockedUntil ||
      new Date(exam.lockedUntil) <= new Date()
    ) {
      return res
        .status(400)
        .json({ message: 'Экзамен не заблокирован.' })
    }

    if (exam.attemptsCount >= 5) {
      return res.status(400).json({
        message:
          'Вы уже использовали максимум (5 попыток). Больше купить нельзя.',
      })
    }

    // 3. Списываем монеты у пользователя (ИСПРАВЛЕНО: меняем progression.coins)
    user.progression.coins -= coinPrice
    await user.save()

    // 4. Сбрасываем блокировку в документе прогресса
    const updatedProgress = await UserCourseProgress.findOneAndUpdate(
      { userId, courseCode },
      {
        $set: {
          'blocksProgress.exam.lockedUntil': null,
          'blocksProgress.exam.aiFeedback': '',
        },
      },
      { new: true },
    )

    // Возвращаем обновленный баланс из progression.coins
    return res.status(200).json({
      success: true,
      message: `Попытка успешно куплена! Списано ${coinPrice} монет.`,
      remainingCoins: user.progression.coins,
      progressData: updatedProgress,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({
      message: 'Ошибка при покупке попытки за монеты.',
    })
  }
}

const restartCourse = async (req, res) => {
  try {
    const { courseCode } = req.body
    const userId = req.userId

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress)
      return res.status(404).json({ message: 'Прогресс не найден' })

    // Проверяем, что курс действительно завершен (успешно или неуспешно)
    if (progress.status === 'active') {
      return res
        .status(400)
        .json({ message: 'Нельзя перезапустить активный курс' })
    }

    // 1. Формируем архивную запись из текущего состояния
    const archiveRecord = {
      status: progress.status,
      finishedAt: new Date(),
      blocksProgress: JSON.parse(
        JSON.stringify(progress.blocksProgress),
      ), // глубокое копирование
    }

    // 2. Сбрасываем прогресс до дефолтных значений и пушим старый в history
    const updatedProgress = await UserCourseProgress.findOneAndUpdate(
      { userId, courseCode },
      {
        $set: {
          status: 'active',
          currentBlockIndex: 0,
          'blocksProgress.theory.isCompleted': false,
          'blocksProgress.aiWorkout': {
            isCompleted: false,
            accumulatedScore: 0,
            sessionsCount: 0,
          },
          'blocksProgress.irlChallenge': {
            isCompleted: false,
            textReport: '',
            aiFeedback: '',
          },
          'blocksProgress.exam': {
            isCompleted: false,
            bestScore: 0,
            attemptsCount: 0,
            lockedUntil: null,
            aiFeedback: '',
          },
        },
        $push: {
          history: archiveRecord, // 💡 Сохраняем в историю
        },
      },
      { new: true },
    )

    return res.status(200).json({
      success: true,
      progressData: updatedProgress,
    })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Ошибка при перезапуске курса' })
  }
}

const getUserCoursesArchive = async (req, res) => {
  try {
    const userId = req.userId

    // Находим все курсы пользователя, где в массиве history есть хотя бы одна запись
    const archives = await UserCourseProgress.find(
      { userId, 'history.0': { $exists: true } },
      { courseCode: 1, history: 1 }, // Берем только код курса и историю
    )

    return res.status(200).json({ success: true, archives })
  } catch (error) {
    console.error(error)
    return res
      .status(500)
      .json({ message: 'Ошибка при получении архива.' })
  }
}

export {
  getCourseProgress,
  startCourse,
  submitTheory,
  submitIrlReport,
  submitExamReport,
  unlockExamWithCoins,
  restartCourse,
  getUserCoursesArchive,
}
