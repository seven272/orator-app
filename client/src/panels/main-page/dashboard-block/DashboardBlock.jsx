import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RANKS } from '../../../constants/ranks'

import styles from './DashboardBlock.module.css'

const DashboardBlock = () => {
  const navigate = useNavigate()

  const userData = useSelector((state) => state.profile?.user) || {}
  const { speakerProgress } = useSelector((state) => state.rank) || {}

  const lifetimeXp = userData.lifetimeXp || 0
  const rankIndex =
    speakerProgress?.currentRank?.rankIndex ??
    userData.progression?.speakerRank ??
    userData.speakerRank ??
    0

  const currentStage =
    RANKS.find((r) => r.rankIndex === rankIndex) || RANKS[0]
  const nextStage =
    RANKS.find((r) => r.rankIndex === rankIndex + 1) || null

  const isMaxRank = !nextStage

  // Считаем процент прогресса до следующего ранга
  let rankProgressPercent = 100
  if (!isMaxRank) {
    if (speakerProgress?.requirements?.xp?.percent !== undefined) {
      rankProgressPercent = speakerProgress.requirements.xp.percent
    } else {
      const startXp = currentStage.minXp
      const targetXp = nextStage.minXp
      const range = Math.max(targetXp - startXp, 1)
      const earned = Math.max(lifetimeXp - startXp, 0)
      rankProgressPercent = Math.min(
        Math.round((earned / range) * 100),
        100,
      )
    }
  }

  return (
    <section
      className={styles.banner}
      onClick={() => navigate('/dashboard')}
      role="button"
      tabIndex={0}
    >
      <div className={styles.banner_header}>
        <h2 className={styles.banner_title}>
          📊 ПУТЬ ОРАТОРА И СТАТИСТИКА
        </h2>
      </div>

      <div className={styles.banner_wrapper}>
        <div className={styles.banner_row}>
          <div className={styles.rank_info}>
            <img
              src={currentStage.icon}
              alt={currentStage.title}
              className={styles.rank_icon}
            />
            <span className={styles.text_main}>
              Ранг:{' '}
              <span className={styles.text_main_subtitle}>
                {currentStage.title}{' '}
                {!isMaxRank && `(${rankProgressPercent}%)`}
              </span>
            </span>
          </div>

          <span className={styles.badge_xp}>
            ⚡ {lifetimeXp.toLocaleString()} XP
          </span>
        </div>

        <div className={styles.progress_container}>
          <div
            className={styles.progress_bar}
            style={{ width: `${rankProgressPercent}%` }}
          />
        </div>

        <div className={styles.banner_footer}>
          <span>
           Нажмите, чтобы посмотреть полную статистику
          </span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default DashboardBlock
