import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaStar, FaAward, FaFire, FaCoins } from 'react-icons/fa'

import styles from './PointsUser.module.css'

const PointsUser = () => {
  const navigate = useNavigate()
  const { level, coins, xp, streak } = useSelector((state) => state.profile.user)

  return (
    <div
      className={styles.main_points_user}
      onClick={() => navigate('/mini-dashboard')}
    >
      {/* Верхний ярус таблички */}
      <div className={styles.row}>
        <div className={styles.box}>
          <span className={styles.title}>
            <FaStar size={11} className={styles.icon_level} /> Уровень
          </span>
          <span className={styles.value}>{level}</span>
        </div>
        <div className={styles.box}>
          <span className={styles.title}>
            <FaAward size={11} className={styles.icon_xp} /> Xp
          </span>
          <span className={styles.value}>{xp}</span>
        </div>
      </div>

      {/* Нижний ярус таблички */}
      <div className={styles.row}>
        <div className={styles.box}>
          <span className={styles.title}>
            <FaFire size={11} className={styles.icon_streak} /> Стрик
          </span>
          <span className={styles.value}>{streak}</span>
        </div>
        <div className={styles.box}>
          <span className={styles.title}>
            <FaCoins size={11} className={styles.icon_coins} /> Монеты
          </span>
          <span className={styles.value}>{coins}</span>
        </div>
      </div>
    </div>
  )
}

export default PointsUser
