import gigachatAxiosClient from '../../../../utils/gigachatAxiosClient.js'
import UserCourseProgress from '../../../../models/UserCourseProgress.js'
import Course from '../../../../models/Course.js'
import { parseAiResponse } from '../../../../utils/aiJsonParser.js'
import { transcribeShortAudio } from '../../../../utils/speechService.js'
import {
  getTaxiBlitzDialogPrompt,
  TAXI_BLITZ_EVALUATION_PROMPT,
} from './taxiBlitzPrompt.js'

const startTaxiBlitzTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode, exerciseData } = req.body

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (!progress) {
      return res
        .status(404)
        .json({ message: 'Прогресс по данному интенсиву не найден' })
    }

    if (progress.currentBlockIndex !== 1) {
      return res
        .status(400)
        .json({
          message:
            'Вы не можете пройти ИИ-тренажер на текущем этапе курса',
        })
    }

    const preview = `Вы сели в такси. Роль водителя: "${exerciseData.role}". ${exerciseData.context}. \nВодитель посматривает на вас через зеркало заднего вида и внезапно нарушает тишину...`
    const question = `${exerciseData.firstQuestion}`

    progress.blocksProgress.aiWorkout.currentSession = {
      status: 'active',
      workoutConfigId: 'taxi_blitz',
      exerciseData,
      messages: [],
      createdAt: new Date(),
    }

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(201).json({ preview, question })
  } catch (error) {
    console.error('Error in startTaxiBlitzTrainer:', error)
    res
      .status(500)
      .json({
        message: 'Ошибка сервера при старте тренажера Такси-Блиц',
        error: error.message,
      })
  }
}

const generateTaxiBlitzResponse = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body
    let userMessage = null

    const progress = await UserCourseProgress.findOne({
      userId,
      courseCode,
    })
    if (
      !progress ||
      !progress.blocksProgress?.aiWorkout?.currentSession
    ) {
      return res
        .status(400)
        .json({
          message:
            'Активная сессия тренажера не найдена. Начните сначала.',
        })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    if (session.status !== 'active') {
      return res
        .status(400)
        .json({ message: 'Эта сессия уже завершена.' })
    }

    const { role, topic, context } = session.exerciseData

    if (req.file) {
      try {
        userMessage = await transcribeShortAudio(req.file.buffer)
      } catch (speechError) {
        console.error(
          'Ошибка STT в тренажере Такси-Блиц:',
          speechError,
        )
        return res
          .status(500)
          .json({
            message:
              'Не удалось распознать вашу речь. Пожалуйста, повторите запись.',
            error: speechError.message,
          })
      }
    } else {
      return res
        .status(400)
        .json({ message: 'Аудиофайл ответа не был передан.' })
    }

    const attemptsCount = session.messages.filter(
      (m) => m.role === 'user',
    ).length
    const isFinished = attemptsCount >= 2

    if (!userMessage || !userMessage.trim()) {
      session.messages.push({
        role: 'user',
        text: 'Пользователь промолчал',
      })
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        answer:
          'Вы промолчали. Водитель удивленно приподнял бровь и ждет, пока вы подхватите тему разговора.',
        isPitchFinished: isFinished,
        isError: true,
      })
    }

    const cleanUserMessage = userMessage.trim()
    const PROMPT = getTaxiBlitzDialogPrompt(
      role,
      topic,
      context,
      cleanUserMessage,
    )

    const response = await gigachatAxiosClient.post(
      '/chat/completions',
      {
        model: 'GigaChat-2',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 300,
      },
    )

    const aiAnswer = response.data.choices?.[0]?.message?.content
    if (!aiAnswer) {
      throw new Error(
        'Пустой ответ от GigaChat в тренажере Такси-Блиц',
      )
    }

    session.messages.push({ role: 'user', text: cleanUserMessage })
    session.messages.push({
      role: 'assistant',
      text: aiAnswer.trim(),
    })

    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    const sleep = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms))
    await sleep(Math.floor(Math.random() * 1500) + 1500)

    return res.json({
      user_transcript: cleanUserMessage,
      answer: aiAnswer.trim(),
      isPitchFinished: isFinished,
    })
  } catch (error) {
    console.error(
      'Ошибка в generateTaxiBlitzResponse:',
      error.message,
    )
    res
      .status(503)
      .json({
        answer:
          'Водитель отвлекся на дорожную ситуацию. Пожалуйста, повторите вашу фразу.',
      })
  }
}

const finishTaxiBlitzTrainer = async (req, res) => {
  try {
    const userId = req.userId
    const { courseCode } = req.body

    const [progress, course] = await Promise.all([
      UserCourseProgress.findOne({ userId, courseCode }),
      Course.findOne({ courseCode }),
    ])

    if (!progress || !course) {
      return res
        .status(404)
        .json({ message: 'Необходимые данные не найдены' })
    }

    if (
      progress.currentBlockIndex !== 1 ||
      !progress.blocksProgress?.aiWorkout?.currentSession
    ) {
      return res
        .status(400)
        .json({ message: 'Нет активной сессии или блок недоступен' })
    }

    const session = progress.blocksProgress.aiWorkout.currentSession
    const meaningfulMessages = session.messages.filter(
      (m) => m.role === 'user' && m.text !== 'Пользователь промолчал',
    )

    if (meaningfulMessages.length < 2) {
      progress.blocksProgress.aiWorkout.sessionsCount += 1
      progress.blocksProgress.aiWorkout.currentSession = null
      progress.markModified('blocksProgress.aiWorkout')
      await progress.save()

      return res.status(200).json({
        message:
          'Тренажер завершен без оценки из-за отсутствия содержательных ответов',
        totalScore: 0,
        feedback:
          'Слишком много пропущенных реплик. Водитель включил радио и замолчал.',
        progressData: progress,
      })
    }

    const chatHistory = session.messages
      .map(
        (m) =>
          `${m.role === 'user' ? 'Пассажир' : 'Водитель'} : ${m.text}`,
      )
      .join('\n')

    let evaluation = null

    try {
      const response = await gigachatAxiosClient.post(
        '/chat/completions',
        {
          model: 'GigaChat-2',
          messages: [
            { role: 'system', content: TAXI_BLITZ_EVALUATION_PROMPT },
            {
              role: 'user',
              content: `Проанализируй этот спонтанный экспромт-диалог в такси:\n${chatHistory}`,
            },
          ],
          max_tokens: 700,
        },
      )

      evaluation = parseAiResponse(
        response.data.choices[0].message.content,
        {
          reactionSpeed: 40,
          structuralFrame: 40,
        },
      )
    } catch (apiError) {
      console.error(
        'Сбой сети GigaChat при оценке тренажера Такси-Блиц:',
        apiError.message,
      )
    }

    if (!evaluation) {
      evaluation = {
        totalScore: 50,
        feedback:
          'Поездка окончена. Из-за технических неполадок подробная аналитика временно недоступна.',
        criteria: { reactionSpeed: 50, structuralFrame: 50 },
      }
    }

    const aiBlockConfig = course.blocks.find(
      (block) => block.blockType === 'ai_workout',
    )
    const requiredScore =
      aiBlockConfig?.aiWorkoutConfig?.requiredScore || 1000

    progress.blocksProgress.aiWorkout.sessionsCount += 1
    let isScoreCounted = false

    if (evaluation.totalScore >= 65) {
      progress.blocksProgress.aiWorkout.accumulatedScore +=
        evaluation.totalScore
      isScoreCounted = true
    }

    if (
      progress.blocksProgress.aiWorkout.accumulatedScore >=
      requiredScore
    ) {
      progress.blocksProgress.aiWorkout.isCompleted = true
      progress.currentBlockIndex = 2
    }

    progress.blocksProgress.aiWorkout.currentSession = null
    progress.markModified('blocksProgress.aiWorkout')
    await progress.save()

    return res.status(200).json({
      status: progress.status,
      currentBlockIndex: progress.currentBlockIndex,
      progressData: progress,
      evaluation: {
        totalScore: evaluation.totalScore,
        feedback: evaluation.feedback,
        criteria: evaluation.criteria, // { reactionSpeed, structuralFrame }
        isScoreCounted,
      },
    })
  } catch (error) {
    console.error('Ошибка финализации тренажера Такси-Блиц:', error)
    return res
      .status(500)
      .json({
        message:
          'Внутренняя ошибка сервера при фиксации результатов тренажера',
      })
  }
}

export {
  startTaxiBlitzTrainer,
  generateTaxiBlitzResponse,
  finishTaxiBlitzTrainer,
}
