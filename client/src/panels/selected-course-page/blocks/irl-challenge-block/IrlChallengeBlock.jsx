import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { fetchSubmitIrlReport } from '../../../../redux/slices/courseSlice'
import ChallengeInstructions from './challenge-instructions/ChallengeInstructions'
import ChallengeForm from './challenge-form/ChallengeForm'
import TheoryReviewMode from '../theory-review-mode/TheoryReviewMode'
import styles from './IrlChallengeBlock.module.css'
import { COURSES_STATIC_CONTENT } from '../../../../assets/data/courses/coursesContent'

const IrlChallengeBlock = ({ courseCode }) => {
  const dispatch = useDispatch()
  const { error, progressData, irlSubmittingStatus } = useSelector(
    (state) => state.course,
  )
  const [isReviewingTheory, setIsReviewingTheory] = useState(false)

  // Извлекаем уже имеющиеся данные отчета, если пользователь заходил ранее
  const savedReport =
    progressData?.blocksProgress?.irlChallenge?.textReport || ''
  const isCompleted =
    progressData?.blocksProgress?.irlChallenge?.isCompleted || false
  const isSubmitting = irlSubmittingStatus === 'loading'

  const courseStatic = COURSES_STATIC_CONTENT[courseCode]
  //файлы теории
  const theorySlides = courseStatic.theory?.slides || []
  const irlStatic = courseStatic?.irl_challenge

  const challengeData = {
    title: irlStatic?.title || '🎯 Задание в реальном мире',
    instructions:
      irlStatic?.instructions ||
      'Выполните практическое задание курса.',
  }

  const handleSubmitReport = async (textReport) => {
    if (!textReport.trim()) return

    try {
      // Имитируем задержку запроса к бэкенду
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await dispatch(
        fetchSubmitIrlReport({ courseCode, textReport }),
      ).unwrap()
    } catch (err) {
      console.error('Ошибка при отправке отчета:', err)
      message.error(err || 'Не удалось отправить отчет')
    }
  }

  if (isReviewingTheory) {
    return (
      <TheoryReviewMode
        slides={theorySlides}
        onBack={() => setIsReviewingTheory(false)}
      />
    )
  }

  return (
    <div className={styles.challenge_container}>
      <ChallengeInstructions data={challengeData} />

      <ChallengeForm
        savedReport={savedReport}
        isCompleted={isCompleted}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmitReport}
      />

      {error && <div className={styles.error_alert}>{error}</div>}

      <button
        className={styles.refresh_theory_btn}
        onClick={() => setIsReviewingTheory(true)}
      >
        📖 Вспомнить теорию
      </button>
    </div>
  )
}

export default IrlChallengeBlock
