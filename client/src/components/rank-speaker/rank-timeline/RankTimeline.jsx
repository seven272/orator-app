/* eslint-disable react/prop-types */
import React from 'react'
import { RANKS } from '../../../constants/ranks'
import styles from './RankTimeline.module.css'

const STEP_SIZE_CLASSES = [
  styles.step_0,
  styles.step_1,
  styles.step_2,
  styles.step_3,
  styles.step_4,
]

const RankTimeline = ({
  stagesTimeline = [],
  nextRankIndex,
  selectedStageIndex,
  canRankUp,
  completedCount,
  totalCount,
  onSelectStage,
}) => {
  return (
    <div className={styles.amphitheater_scroll}>
      <div className={styles.amphitheater_row}>
        {RANKS.map((stage) => {
          const serverStage = stagesTimeline.find(
            (s) => s.rankIndex === stage.rankIndex,
          )
          const isReached = serverStage?.isReached ?? false
          const isCurrent = serverStage?.isCurrent ?? false
          const isNextTarget =
            nextRankIndex !== null &&
            stage.rankIndex === nextRankIndex
          const isSelected = selectedStageIndex === stage.rankIndex
          const sizeClass =
            STEP_SIZE_CLASSES[stage.rankIndex] || styles.step_0

          return (
            <button
              key={stage.rankIndex}
              type="button"
              onClick={() => onSelectStage(stage.rankIndex)}
              className={`${styles.stage_step} ${isReached ? styles.step_reached : ''} ${isCurrent ? styles.step_current : ''} ${isNextTarget ? styles.step_next : ''} ${isSelected ? styles.step_selected : ''}`}
            >
              <div className={`${styles.medallion} ${sizeClass}`}>
                <img
                  src={stage.icon}
                  alt={stage.title}
                  className={styles.rank_png_icon}
                />

                {isReached && !isCurrent && (
                  <span className={styles.done_mark}>✓</span>
                )}

                {isNextTarget && !canRankUp && (
                  <span className={styles.progress_pill}>
                    {completedCount}/{totalCount}
                  </span>
                )}
              </div>

              <span className={styles.step_title}>{stage.title}</span>
              <span className={styles.step_xp}>
                {stage.minXp === 0
                  ? 'Старт'
                  : `${stage.minXp / 1000}к XP`}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RankTimeline
