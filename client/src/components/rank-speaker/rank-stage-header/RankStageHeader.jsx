/* eslint-disable react/prop-types */
import React from 'react'
import styles from './RankStageHeader.module.css'

const RankStageHeader = ({
  currentRankIndex,
  currentStageConfig,
  nextStageConfig,
  isMaxRank,
  canRankUp,
  rankUpLoading,
  isNextDrawerOpen,
  completedCount = 0,
  totalCount = 4,
  onRankUp,
  onToggleNextGate,
}) => {
  const dots = Array.from({ length: totalCount }, (_, i) => i)

  return (
    <div className={styles.pass_header}>
      <div
        className={`${styles.spotlight_medallion} ${styles[`tier_${currentRankIndex}`] || ''}`}
      >
        <img
          src={currentStageConfig.icon}
          alt={currentStageConfig.title}
          className={styles.medallion_png}
        />
      </div>

      <div className={styles.pass_info}>
        <div className={styles.pass_meta_row}>
          <span className={styles.pass_tag}>РАНГ ОРАТОРА</span>
        </div>

        <h4 className={styles.pass_title}>
          {currentStageConfig.title}
        </h4>
        <p className={styles.pass_quote}>
          «{currentStageConfig.desc}»
        </p>
      </div>

      {!isMaxRank && nextStageConfig && (
        <div className={styles.pass_actions}>
          {canRankUp ? (
            <button
              type="button"
              className={styles.hero_rankup_btn}
              disabled={rankUpLoading}
              onClick={onRankUp}
            >
              {rankUpLoading
                ? 'Повышаем...'
                : `🎉 Получить ранг «${nextStageConfig.title}»`}
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.gate_trigger_btn} ${isNextDrawerOpen ? styles.gate_trigger_active : ''}`}
              onClick={onToggleNextGate}
            >
              <div className={styles.dots_row} aria-hidden="true">
                {dots.map((dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`${styles.progress_dot} ${dotIdx < completedCount ? styles.dot_filled : ''}`}
                  />
                ))}
              </div>
              <span>Следующий этап</span>
              <span className={styles.chevron}>
                {isNextDrawerOpen ? '▲' : '▼'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default RankStageHeader
