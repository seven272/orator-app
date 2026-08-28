import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchProfileData } from '../../../redux/slices/profileSlice'

import {
  FaFire,
  FaCoins,
  FaTrophy,
  FaChevronRight,
  FaCrosshairs,
  FaAward,
} from 'react-icons/fa'

import styles from './MiniDashboard.module.css'

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

  const progressPercent = Math.min(
    Math.max(user.levelProgressPercent || 0, 0),
    100,
  )

  return (
    <div className={styles.micro_card}>
      {/* 1. Верхняя строка: Стрик, Жетоны и Общий опыт */}
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

      {/* 2. Середина: Уровень и прогресс-бар */}
      <div className={styles.level_zone}>
        <div className={styles.level_info}>
          <span className={styles.level_text}>
            <FaTrophy className={styles.icon_level} /> {user.level}{' '}
            уровень
          </span>
          <span className={styles.xp_text}>{user.xp} XP</span>
        </div>
        <div className={styles.custom_progress_trail}>
          <div
            className={styles.custom_progress_bar}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 3 Ближайшая цель / Зона роста */}
      {weakPoint && (
        <div className={styles.target_zone}>
          <FaCrosshairs className={styles.icon_target} />
          <span className={styles.target_text}>
            Фокус: <strong>{weakPoint.skill}</strong>
          </span>
        </div>
      )}

      {/* 5. Кнопка перехода на основной дашборд */}
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
