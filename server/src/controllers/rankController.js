import User from '../models/User.js'
import { RANKS } from '../constants/ranks.js'
import {
  calculateSpeakerProgress,
  promoteUserRank,
} from '../utils/rankService.js'
import { sendGigaChatRequest } from '../utils/gigachatService.js'
import { parseAiResponse } from '../utils/aiJsonParser.js'

/**
 * Внутренняя функция оценки текстового отчета о реальном задании через GigaChat
 */
const evaluateRealWorldTaskReport = async ({
  taskTitle,
  taskDescription,
  reportText,
}) => {
  const systemPrompt = `Ты — опытный наставник по ораторскому искусству и коммуникациям.
Пользователь должен был выполнить практическое задание в реальной жизни и написать текстовый отчет о том, как это прошло.

Твоя задача: оценить отчет на адекватность, искренность и соответствие условиям задания.
Критерии зачета (passed: true):
1. Отчет написан по существу, а не является набором случайных символов или отпиской в 2 слова.
2. Из описания понятно, что пользователь действительно выполнил действие из задания, описал контекст, свои действия и реакцию собеседника/аудитории.

Критерии незачета (passed: false):
1. Отписка, слишком поверхностный текст без деталей выполнения.
2. Отчет не соответствует теме задания.

Верни ответ СТРОГО в формате JSON без markdown-оберток и переносов строк внутри значений:
{
  "passed": true,
  "feedback": "Твой конструктивный комментарий (2-3 предложения): похвали за конкретику или мягко объясни, каких деталей не хватает для зачета"
}
Правила: КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО использовать одинарные кавычки (') и переносы строк внутри JSON. Используй только кавычки-елочки «».`

  const userPrompt = `Задание: «${taskTitle}»
Описание задания: «${taskDescription}»
Отчет пользователя: «${reportText}»`

  try {
    const rawResponse = await sendGigaChatRequest(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      600,
      0.3,
    )

    // Извлекаем чистый JSON-объект напрямую, минуя валидатор тренажеров в parseAiResponse
    const cleaned = String(rawResponse)
      .replace(/```json|```/gi, '')
      .trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      throw new Error('JSON-объект не найден в ответе GigaChat')
    }

    const parsed = JSON.parse(jsonMatch[0])
    const isPassed = parsed.passed === true || parsed.passed === 'true'

    return {
      passed: isPassed,
      feedback:
        parsed.feedback ||
        (isPassed
          ? 'Отличная работа! Задание зачтено.'
          : 'Пожалуйста, опишите выполнение задания подробнее.'),
    }
  } catch (err) {
    console.error('Ошибка разбора ответа GigaChat в real-task:', err.message)
    return {
      passed: false,
      feedback:
        'Не удалось проверить отчет из-за временного сбоя ответа нейросети. Попробуйте отправить еще раз.',
    }
  }
}

/**
 * GET /api/rank/progress
 * Получение актуального прогресса по Карте ораторского пути
 */
const getRankProgressController = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      'progression stats',
    )
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    const speakerProgress = calculateSpeakerProgress(user)
    res.status(200).json({ speakerProgress })
  } catch (error) {
    console.error('Ошибка получения прогресса ранга:', error)
    res.status(500).json({
      message: 'Ошибка сервера при получении прогресса ранга',
    })
  }
}

/**
 * POST /api/rank/upgrade
 * Явное повышение ранга по кнопке после выполнения всех 4 условий
 */
const rankUpController = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    const updatedSpeakerProgress = await promoteUserRank(user)

    res.status(200).json({
      message: `Поздравляем! Вы получили ранг «${updatedSpeakerProgress.currentRank.title}»`,
      speakerProgress: updatedSpeakerProgress,
    })
  } catch (error) {
    res.status(400).json({
      message: error.message || 'Не удалось повысить ранг',
    })
  }
}

/**
 * POST /api/rank/real-task
 * Отправка текстового отчета о реальном задании на проверку в GigaChat
 */
const submitRealTaskController = async (req, res) => {
  try {
    const { targetRank, reportText } = req.body
  

    if (!reportText || reportText.trim().length < 20) {
      return res.status(400).json({
        message:
          'Отчет слишком короткий. Опишите ваш опыт подробнее (от 20 символов).',
      })
    }

    const user = await User.findById(req.userId)
    if (!user) {
      return res
        .status(404)
        .json({ message: 'Пользователь не найден' })
    }

    const stageConfig = RANKS.find(
      (r) =>
        r.nextRankRequirements?.targetRank === Number(targetRank),
    )

    if (!stageConfig) {
      return res
        .status(400)
        .json({ message: 'Некорректный целевой ранг' })
    }

    const currentProgress = calculateSpeakerProgress(user)
    if (!currentProgress.requirements?.realWorldTask?.isUnlocked) {
      return res.status(403).json({
        message:
          'Задание заблокировано. Сначала наберите нужный XP и баллы в обязательных ИИ-тренажерах.',
      })
    }

    const realTaskConfig =
      stageConfig.nextRankRequirements.realWorldTask

    const challengeIndex = user.progression.rankChallenges.findIndex(
      (c) => c.targetRank === Number(targetRank),
    )

    if (
      challengeIndex > -1 &&
      user.progression.rankChallenges[challengeIndex]
        .realTaskCompleted
    ) {
      return res.status(400).json({
        message: 'Это реальное задание уже выполнено и зачтено',
      })
    }

    const evaluation = await evaluateRealWorldTaskReport({
      taskTitle: realTaskConfig.title,
      taskDescription: realTaskConfig.description,
      reportText: reportText.trim(),
    })

    if (challengeIndex === -1) {
      user.progression.rankChallenges.push({
        targetRank: Number(targetRank),
        realTaskCompleted: evaluation.passed,
        realTaskReport: reportText.trim(),
        realTaskFeedback: evaluation.feedback,
        ...(evaluation.passed && { completedAt: new Date() }),
      })
    } else {
      const record = user.progression.rankChallenges[challengeIndex]
      record.realTaskCompleted = evaluation.passed
      record.realTaskReport = reportText.trim()
      record.realTaskFeedback = evaluation.feedback
      if (evaluation.passed) {
        record.completedAt = new Date()
      }
    }

    user.markModified('progression.rankChallenges')
    await user.save()

    const updatedSpeakerProgress = calculateSpeakerProgress(user)

    res.status(200).json({
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      speakerProgress: updatedSpeakerProgress,
    })
  } catch (error) {
    console.error('Ошибка проверки реального задания:', error)
    res.status(500).json({
      message: 'Ошибка сервера при проверке отчета',
    })
  }
}

export {
  submitRealTaskController,
  rankUpController,
  getRankProgressController,
}
