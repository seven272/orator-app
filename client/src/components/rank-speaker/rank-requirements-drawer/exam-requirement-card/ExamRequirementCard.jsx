/* eslint-disable react/prop-types */
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { openPremiumModal } from '../../../../redux/slices/profileSlice'
import styles from './ExamRequirementCard.module.css'

const ExamRequirementCard = ({ examReq, uiExam }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isPremium = useSelector((state) => state.profile?.user?.isPremium)

  if (!examReq || !uiExam) return null

  const handleExamClick = () => {
    if (!isPremium) {
      dispatch(openPremiumModal())
      return
    }
    navigate(`/rank-exam/${examReq.alias}`)
  }

  return (
    <div
      className={`${styles.req_card} ${examReq.isDone ? styles.card_done : ''} ${!examReq.isUnlocked ? styles.card_locked : ''}`}
    >
      <div className={styles.card_top}>
        <span className={styles.card_badge}>3. {uiExam.title}</span>
        <span className={styles.card_icon}>
          {examReq.isDone ? '✅' : examReq.isUnlocked ? '🔥' : '🔒'}
        </span>
      </div>

      <p className={styles.card_desc}>
        {examReq.isDone
          ? `Сдано! Лучший результат: ${examReq.bestScore} баллов`
          : examReq.isUnlocked
            ? `${uiExam.description} (Нужно >${examReq.minScore} баллов)`
            : 'Заблокировано. Выполните условия 1 и 2, чтобы открыть экзамен.'}
      </p>

      {examReq.isUnlocked && !examReq.isDone && (
        <button
          type="button"
          className={styles.card_primary_btn}
          onClick={handleExamClick}
        >
          {isPremium ? 'Сдать экзамен' : '👑 Сдать экзамен'}
        </button>
      )}
    </div>
  )
}

export default ExamRequirementCard
