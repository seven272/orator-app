import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { message } from 'antd'

import ChallengeVerdict from '../challenge-verdict/ChallengeVerdict'
import styles from './ChallengeForm.module.css'

const ChallengeForm = ({
  savedReport,
  isCompleted,
  isSubmitting,
  onSubmit,
}) => {
  // Достаем фидбек напрямую из Redux
  const aiFeedback =
    useSelector(
      (state) =>
        state.course.progressData?.blocksProgress?.irlChallenge
          ?.aiFeedback,
    ) || ''

  const [reportText, setReportText] = useState(savedReport)
  const [isEditing, setIsEditing] = useState(
    !isCompleted && !aiFeedback,
  )

  const handleLocalSubmit = (e) => {
    e.preventDefault()
    if (reportText.trim().length < 20) {
      message.warning(
        'Пожалуйста, напишите чуть подробнее (минимум 20 символов).',
      )
      return
    }
    onSubmit(reportText)
    setIsEditing(false)
  }

  // Состояние 1: Идёт анализ ИИ
  if (isSubmitting) {
    return (
      <div className={styles.form_card}>
        <div className={styles.loader_container}>
          <div className={styles.spinner}></div>
          <p className={styles.loader_text}>
            ИИ анализирует ваш отчет. Это займет около 15 секунд...
          </p>
        </div>
      </div>
    )
  }

  // Состояние 2: Показываем выделенный экран вердикта
  if (aiFeedback && !isEditing) {
    return (
      <ChallengeVerdict
        aiFeedback={aiFeedback}
        isCompleted={isCompleted}
        reportText={reportText}
        onRetry={() => setIsEditing(true)}
      />
    )
  }

  // Состояние 3: Форма ввода (первичная или режим редактирования после ошибки)
  return (
    <div className={styles.form_card}>
      <h3 className={styles.form_title}>Ваш текстовый отчет</h3>

      <form
        onSubmit={handleLocalSubmit}
        className={styles.form_element}
      >
        <textarea
          className={styles.report_textarea}
          placeholder="Опишите ваши результаты здесь..."
          value={reportText}
          onChange={(e) => setReportText(e.target.value)}
          rows={6}
        />

        <button
          type="submit"
          className={styles.submit_button}
          disabled={!reportText.trim()}
        >
          Отправить на проверку ИИ
        </button>
      </form>
    </div>
  )
}

export default ChallengeForm
