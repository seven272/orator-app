/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { fetchSubmitRealWorldTask } from '../../../../redux/slices/rankSlice'
import styles from './RealTaskRequirementCard.module.css'

const RealTaskRequirementCard = ({ realTaskReq, uiRealTask }) => {
  const dispatch = useDispatch()
  const { realTaskLoading } = useSelector((state) => state.rank)

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [reportText, setReportText] = useState('')
  const [aiReviewFeedback, setAiReviewFeedback] = useState('')

  if (!realTaskReq || !uiRealTask) return null

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    if (reportText.trim().length < 20) {
      message.warning('Опишите выполнение задания подробнее (от 20 символов)')
      return
    }

    try {
      const res = await dispatch(
        fetchSubmitRealWorldTask({
          targetRank: realTaskReq.targetRank,
          reportText: reportText.trim(),
        }),
      ).unwrap()

      setAiReviewFeedback(res.feedback)
      if (res.passed) {
        message.success('Задание в реальной жизни зачтено!')
        setIsTaskFormOpen(false)
      } else {
        message.info('ИИ-наставник просит дополнить отчет')
      }
    } catch (err) {
      message.error(err || 'Ошибка при отправке отчета')
    }
  }

  const displayedFeedback = aiReviewFeedback || realTaskReq.feedback

  return (
    <div
      className={`${styles.req_card} ${realTaskReq.isDone ? styles.card_done : ''} ${!realTaskReq.isUnlocked ? styles.card_locked : ''}`}
    >
      <div className={styles.card_top}>
        <span className={styles.card_badge}>4. {uiRealTask.title}</span>
        <span className={styles.card_icon}>
          {realTaskReq.isDone
            ? '✅'
            : realTaskReq.isUnlocked
              ? '🌍'
              : '🔒'}
        </span>
      </div>

      <p className={styles.card_desc}>
        {realTaskReq.isUnlocked
          ? uiRealTask.description
          : 'Заблокировано. Выполните условия 1 и 2, чтобы открыть живое задание.'}
      </p>

      {realTaskReq.isUnlocked && !realTaskReq.isDone && (
        <button
          type="button"
          className={styles.card_outline_btn}
          onClick={() => setIsTaskFormOpen((prev) => !prev)}
        >
          {isTaskFormOpen ? 'Отмена' : 'Написать отчет'}
        </button>
      )}

      {isTaskFormOpen && realTaskReq.isUnlocked && !realTaskReq.isDone && (
        <form className={styles.report_box} onSubmit={handleReportSubmit}>
          <textarea
            className={styles.report_textarea}
            rows={3}
            placeholder="Опишите, как вы выполнили задание в жизни и какой была реакция слушателей..."
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            disabled={realTaskLoading}
          />
          <div className={styles.report_footer}>
            <button
              type="submit"
              className={styles.card_primary_btn}
              disabled={realTaskLoading}
            >
              {realTaskLoading
                ? 'ИИ проверяет отчет...'
                : 'Отправить на проверку ИИ'}
            </button>
          </div>
        </form>
      )}

      {displayedFeedback && (
        <div className={styles.ai_feedback_banner}>
          <strong>Вердикт ИИ-наставника:</strong> {displayedFeedback}
        </div>
      )}
    </div>
  )
}

export default RealTaskRequirementCard
