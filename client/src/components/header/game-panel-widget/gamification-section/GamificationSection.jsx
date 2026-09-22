// components/header/game-panel-widget/gamification-section/GamificationSection.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Tooltip } from 'antd'

import { openGuestOffer } from '../../../../redux/slices/exerciseSlice'
import styles from './GamificationSection.module.css'

const GamificationSection = ({ isAuth, isVkGuest, profileUser }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const currentLevel = isAuth ? (profileUser?.level ?? 1) : 0
  const currentXp = isAuth ? (profileUser?.xp ?? 0) : 0

  const handleGamificationClick = () => {
    if (isVkGuest) {
      dispatch(openGuestOffer())
    } else {
      navigate(isAuth ? '/dashboard' : '/auth')
    }
  }

  return (
    <Tooltip
      title="Ваш текущий уровень и игровой опыт. Нажмите для перехода на Дашборд."
      placement="bottom"
      color="var(--color-primary)"
      styles={{ container: { fontFamily: 'var(--font-family-regular)', fontSize: '11px' } }}
    >
      <div
        className={styles.gamification_section}
        onClick={handleGamificationClick}
      >
        <span className={`${styles.status_text} ${styles.level_full}`}>
          Lvl {currentLevel}
        </span>
        <span className={`${styles.status_text} ${styles.level_short}`}>
          Lvl {currentLevel}
        </span>
        <span className={styles.text_divider}>|</span>
        <span className={styles.status_text}>{currentXp} XP</span>
      </div>
    </Tooltip>
  )
}

export default GamificationSection
