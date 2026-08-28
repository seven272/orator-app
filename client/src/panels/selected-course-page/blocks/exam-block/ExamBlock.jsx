import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import {
  fetchSubmitExam,
  fetchUnlockExamWithCoins,
} from '../../../../redux/slices/courseSlice'
import {
  updateCoins,
  updateRewardAfterCourse,
} from '../../../../redux/slices/profileSlice'
import ExamIdle from './exam-idle/ExamIdle'
import ExamQuestions from './exam-questions/ExamQuestions'
import ExamVerdict from './exam-verdict/ExamVerdict'
import ExamLocked from './exam-locked/ExamLocked'
import TheoryReviewMode from '../theory-review-mode/TheoryReviewMode'
import { COURSES_STATIC_CONTENT } from '../../../../assets/data/courses/coursesContent'
import styles from './ExamBlock.module.css'

const ExamBlock = ({ courseCode }) => {
  const dispatch = useDispatch()

  const { error, progressData, examSubmittingStatus } = useSelector(
    (state) => state.course, 
  )
  const examProgress = progressData?.blocksProgress?.exam

  const bestScore = examProgress?.bestScore || 0
  const currentScore = examProgress?.lastAttemptScore || 0
  const isCompleted = examProgress?.isCompleted || false
  const attemptsCount = examProgress?.attemptsCount || 0 
  const aiFeedback = examProgress?.aiFeedback || ''
  const lockedUntilStr = examProgress?.lockedUntil

  const lockedUntil = lockedUntilStr ? new Date(lockedUntilStr) : null
  const isLocked = lockedUntil && lockedUntil > new Date()

  const isCourseFinished =
    progressData?.status === 'completed' ||
    progressData?.status === 'failed' ||
    attemptsCount >= 5

  const [examStarted, setExamStarted] = useState(false)
  // Флаг, закрыл ли пользователь текущий вердикт ИИ
  const [verdictClosed, setVerdictClosed] = useState(false)
   // Режим повторения теории на экзамене
  const [isReviewingTheory, setIsReviewingTheory] = useState(false)
  const isSubmitting = examSubmittingStatus === 'loading'
  // Извлекаем статический контент курса
  const courseStatic = COURSES_STATIC_CONTENT[courseCode]
  const examStatic = courseStatic?.exam
  const theorySlides = courseStatic?.theory?.slides || [] // <-- Забираем слайды Блока 0

  const handleAudioSubmit = async ({ formData }) => {
    try {
      // 💡 Сбрасываем флаг закрытия перед новой отправкой
      setVerdictClosed(false)
      const result = await dispatch(
        fetchSubmitExam({ formData }),
      ).unwrap()
      console.log(result)
      dispatch(updateRewardAfterCourse(result))
    } catch (err) {
      console.error('Ошибка при отправке экзамена:', err)
    }
  }

  const handleUnlockWithCoins = async () => {
    try {
      // 1. Ждем успешного ответа от сервера и разворачиваем результат через unwrap
      const result = await dispatch(
        fetchUnlockExamWithCoins({ courseCode }),
      ).unwrap()

      // 2. Диспатчим новый баланс в profileSlice
      dispatch(updateCoins(result.remainingCoins))

      setVerdictClosed(false)
      message.success('Доступ успешно восстановлен!')
    } catch (err) {
      message.error('Ошибка покупки попытки сдачи экзамена')
      console.error('Ошибка покупки попытки:', err)
    }
  }

   // 👑 ПРИОРИТЕТ 0: Если пользователь нажал "Вспомнить теорию", перекрываем экран инлайн-слайдером
  if (isReviewingTheory) {
    return (
      <TheoryReviewMode
        slides={theorySlides}
        onBack={() => setIsReviewingTheory(false)}
      />
    )
  }

  return (
    <div className={styles.exam_container}>
      {/* 👑 ЭКРАН 1 (ПРИОРИТЕТ 1): Сначала ВСЕГДА показываем вердикт ИИ, если есть фидбек и пользователь его еще не закрыл */}
      {aiFeedback && !verdictClosed && (
        <ExamVerdict
          courseCode={courseCode}
          score={bestScore}
          currentScore={currentScore}
          isCompleted={isCompleted}
          attemptsCount={attemptsCount}
          aiFeedback={aiFeedback}
          isCourseFinished={isCourseFinished}
          onStartNextAttempt={() => {
            // Если курс завершен (успех/фейл), кнопка рестарта сбросит стейт в Redux.
            // Если попытки еще есть, клик по кнопке "Подготовиться..." закроет вердикт и включит экран блокировки.
            setVerdictClosed(true)
            setExamStarted(false)
          }}
        />
      )}

      {/* 🔒 ЭКРАН 2 (ПРИОРИТЕТ 2): Временная блокировка показывается, ТОЛЬКО если вердикт прочитан/закрыт */}
      {isLocked &&
        !isCourseFinished &&
        (verdictClosed || !aiFeedback) && (
          <ExamLocked
            lockedUntil={lockedUntil}
            isSubmitting={isSubmitting}
            onUnlockWithCoins={handleUnlockWithCoins}
            error={error}
          />
        )}
      {/* ЭКРАН 3: Начальный экран (тестирование еще не запущено, нет активного фидбека или он закрыт) */}
      {(!isLocked || isCourseFinished) &&
        (!aiFeedback || verdictClosed) &&
        !examStarted && (
          <ExamIdle
            bestScore={bestScore} 
            isCompleted={isCompleted}
            isCourseFinished={isCourseFinished}
            attemptsCount={attemptsCount}
            staticData={examStatic}
            onStart={() => setExamStarted(true)}
            onReviewTheory={() => setIsReviewingTheory(true)}
          />
        )}

      {/* ЭКРАН 4: Процесс сдачи экзамена */}
      {(!isLocked || isCourseFinished) &&
        (!aiFeedback || verdictClosed) &&
        examStarted && (
          <ExamQuestions
            courseCode={courseCode}
            attemptsCount={attemptsCount}
            isSubmitting={isSubmitting}
            staticData={examStatic}
            onSubmit={handleAudioSubmit}
            onCancel={() => setExamStarted(false)}
          />
        )}

      {error && !isLocked && (
        <div className={styles.error_alert}>{error}</div>
      )}
    </div>
  )
}

export default ExamBlock
