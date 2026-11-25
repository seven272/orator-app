/* eslint-disable react/prop-types */
import React from 'react'
import styles from './RankTimeline.module.css'

const STEP_SIZE_CLASSES = [
  styles.step_0,
  styles.step_1,
  styles.step_2,
  styles.step_3,
  styles.step_4,
]

const RankTimeline = ({
  stagesTimeline,
  nextRank,
  selectedStageIndex,
  canRankUp,
  completedCount,
  totalCount,
  onSelectStage,
}) => {
  if (!stagesTimeline || stagesTimeline.length === 0) return null

  return (
    <div className={styles.amphitheater_scroll}>
      <div className={styles.amphitheater_row}>
        {stagesTimeline.map((stage) => {
          const isNextTarget =
            nextRank && stage.rankIndex === nextRank.rankIndex
          const isSelected = selectedStageIndex === stage.rankIndex
          const sizeClass =
            STEP_SIZE_CLASSES[stage.rankIndex] || styles.step_0

          return (
            <button
              key={stage.rankIndex}
              type="button"
              onClick={() => onSelectStage(stage.rankIndex)}
              className={`${styles.stage_step} ${stage.isReached ? styles.step_reached : ''} ${stage.isCurrent ? styles.step_current : ''} ${isNextTarget ? styles.step_next : ''} ${isSelected ? styles.step_selected : ''}`}
            >
              <div className={`${styles.medallion} ${sizeClass}`}>
                <span className={styles.mic_icon}>{stage.mic}</span>

                {stage.isReached && !stage.isCurrent && (
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
