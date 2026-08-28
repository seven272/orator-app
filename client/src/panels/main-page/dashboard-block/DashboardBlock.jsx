import React from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import styles from './DashboardBlock.module.css'

const DashboardBlock = () => {
  const navigate = useNavigate()

  // деструктуризация с защитой от undefined (fallback объект)
  const userData = useSelector((state) => state.profile?.user) || {}
  const { level = 1, levelProgressPercent = 0, coins = 0 } = userData

  return (
    <section
      className={styles.banner}
      onClick={() => navigate('/dashboard')}
      role="button"
      tabIndex={0}
    >
      <div className={styles.banner_header}>
        <h2 className={styles.banner_title}>
          📊 АНАЛИЗ НАВЫКОВ И ПРОГРЕСС
        </h2>
      </div>

      <div className={styles.banner_wrapper}>
        <div className={styles.banner_row}>
          <span className={styles.text_main}>
            Твой уровень:{' '}
            <strong>
              {level} ({levelProgressPercent}%)
            </strong>
          </span>
          <span className={styles.badge_coins}>🪙 {coins}</span>
        </div>

        {/* Улучшение: Визуальный прогресс-бар для мгновенного считывания UI */}
        <div className={styles.progress_container}>
          <div
            className={styles.progress_bar}
            style={{ width: `${levelProgressPercent}%` }}
          />
        </div>

        <div className={styles.banner_footer}>
          <span>Нажми, чтобы посмотреть полную статистику</span>
          <span className={styles.chevron_icon}>›</span>
        </div>
      </div>
    </section>
  )
}

export default DashboardBlock
