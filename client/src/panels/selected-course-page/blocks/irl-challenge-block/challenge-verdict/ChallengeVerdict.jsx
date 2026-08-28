import React from 'react'
import { useDispatch } from 'react-redux'
import { TiArrowRightThick, TiArrowSync } from 'react-icons/ti'

import { nextBlock } from '../../../../../redux/slices/courseSlice'
import styles from './ChallengeVerdict.module.css'

const ChallengeVerdict = ({
  aiFeedback,
  isCompleted,
  reportText,
  onRetry,
}) => {
  const dispatch = useDispatch()

  return (
    <div className={styles.form_card}>
      <h3 className={styles.form_title}>Вердикт ИИ-наставника</h3>

      <div
        className={
          isCompleted
            ? styles.feedback_success
            : styles.feedback_failed
        }
      >
        <p className={styles.feedback_text}>{aiFeedback}</p>
      </div>

      <div className={styles.history_box}>
        <strong>Ваш отчет:</strong>
        <p className={styles.history_text}>{reportText}</p>
      </div>

      {isCompleted ? (
        <button
          className={styles.next_button}
          onClick={() => dispatch(nextBlock())}
        >
          Перейти к экзамену <TiArrowRightThick size={15}/>
        </button>
      ) : (
        <button className={styles.retry_button} onClick={onRetry}>
          <TiArrowSync size={20}/> Исправить отчет
        </button>
      )}
    </div>
  )
}

export default ChallengeVerdict
