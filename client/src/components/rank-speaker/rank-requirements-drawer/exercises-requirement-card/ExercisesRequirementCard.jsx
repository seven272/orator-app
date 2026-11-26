/* eslint-disable react/prop-types */
import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { openPremiumModal } from '../../../../redux/slices/profileSlice'
import styles from './ExercisesRequirementCard.module.css'

const ExercisesRequirementCard = ({
  exercisesReq,
  uiExercises = [],
}) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isPremium = useSelector(
    (state) => state.profile?.user?.isPremium,
  )

  const handleClickExercise = (exAlias) => {
    console.log(exAlias)
    if (!isPremium) {
      dispatch(openPremiumModal())
      return
    }
    navigate(`/exercise/${exAlias}`)
  }

  if (!exercisesReq) return null

  return (
    <div
      className={`${styles.req_card} ${exercisesReq.isDone ? styles.card_done : ''}`}
    >
      <div className={styles.card_top}>
        <span className={styles.card_badge}>2. ИИ-тренажеры</span>
        <span className={styles.card_icon}>
          {exercisesReq.isDone ? '✅' : '🎯'}
        </span>
      </div>

      <div className={styles.ex_list}>
        {exercisesReq.items.map((ex) => {
          const uiEx = uiExercises.find(
            (item) => item.alias === ex.alias,
          )
          const exTitle = uiEx?.title || ex.alias

          return (
            <div key={ex.alias} className={styles.ex_row}>
              <span className={styles.ex_name}>
                {ex.isDone ? '✓' : '•'} {exTitle} ({ex.bestScore}/&gt;
                {ex.minScore})
              </span>
              {!ex.isDone && (
                <button
                  type="button"
                  className={styles.inline_link}
                  onClick={() => handleClickExercise(ex.alias)}
                >
                  Пройти →
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ExercisesRequirementCard
