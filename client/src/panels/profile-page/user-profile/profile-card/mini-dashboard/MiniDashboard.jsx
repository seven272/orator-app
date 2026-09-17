import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { IoStatsChart } from 'react-icons/io5'
import {
  FaFire,
  FaCoins,
  FaChevronRight,
  FaCrosshairs,
  FaAward,
} from 'react-icons/fa'

import styles from './MiniDashboard.module.css'
import { fetchProfileData } from '../../../../../redux/slices/profileSlice'

const MiniDashboard = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const {
    user,
    weakPoint,
    loading: profileLoading,
  } = useSelector((state) => state.profile)

  useEffect(() => {
    if (!user) {
      dispatch(fetchProfileData())
    }
  }, [dispatch, user])

  if (profileLoading || !user) {
    return (
      <div className={styles.micro_loading}>
        Загрузка статистики...
      </div>
    )
  }

  return (
    <div className={styles.dashboard_wrapper}>
      {/* 1. Строка экспресс-метрики: Стрик, Жетоны и Общий опыт */}
      <div className={styles.dashboard_title}>
        <IoStatsChart className={styles.icon_statistic} />
        <span>Экспресс статистика</span>
      </div>
      <div className={styles.top_row}>
        <div className={styles.metric}>
          <FaFire className={styles.icon_streak} />
          <div className={styles.metric_content}>
            <span className={styles.metric_label}>Дней подряд</span>
            <span className={styles.metric_value}>
              {user.streak} дн.
            </span>
          </div>
        </div>

        <div className={styles.metric}>
          <FaCoins className={styles.icon_coins} />
          <div className={styles.metric_content}>
            <span className={styles.metric_label}>Жетоны</span>
            <span className={styles.metric_value}>{user.coins}</span>
          </div>
        </div>

        <div className={styles.metric}>
          <FaAward className={styles.icon_lifetime_xp} />
          <div className={styles.metric_content}>
            <span className={styles.metric_label}>Всего опыта</span>
            <span className={styles.metric_value}>
              {user.lifetimeXp || 0}{' '}
              <span className={styles.metric_unit}>XP</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Ближайшая цель / Зона роста */}
      {weakPoint && (
        <div className={styles.target_zone}>
          <FaCrosshairs className={styles.icon_target} />
          <span className={styles.target_text}>
            Фокус тренировок: <strong>{weakPoint.skill}</strong>
          </span>
        </div>
      )}

      {/* 3. Кнопка перехода на основной дашборд */}
      <button
        type="button"
        className={styles.more_btn}
        onClick={() => navigate('/dashboard')}
      >
        <span>Полная статистика</span>
        <FaChevronRight className={styles.icon_arrow} />
      </button>
    </div>
  )
}

export default MiniDashboard
