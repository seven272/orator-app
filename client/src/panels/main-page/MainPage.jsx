import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { All_EXERCISES } from '../../assets/mocks/exercises'
import { fetchDailyTasks } from '../../redux/slices/dailySlice'
import styles from './MainPage.module.css'

import DashboardBlock from './dashboard-block/DashboardBlock'
import DailyChallengesBlock from './daily-challenges-block/DailyChallengesBlock'
import ExerciseCatalogBlock from './exercise-catalog-block/ExerciseCatalogBlock'
import LeaderboardShortBlock from './leaderboard-short-block/LeaderboardShortBlock'
import ActivityBlock from './activity-block/ActivityBlock'
import CoursesBannerBlock from './courses-banner-block/CoursesBannerBlock'

const MainPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchDailyTasks())
  }, [dispatch])

  const { tasks = [] } = useSelector((state) => state.daily || {})
  const currentTask = tasks[0] || {}
  const { alias, title, description, locked } = currentTask

  const exerciseConfig = alias 
    ? Object.values(All_EXERCISES).flat().find((ex) => ex.alias === alias) 
    : null
  const iconSrc = exerciseConfig?.icon

  const handleStartExercise = () => {
    if (locked) {
      navigate('/exercises-daily')
      return
    }
    if (alias) {
      navigate(`/exercise/${alias}?daily=true`)
    }
  }

  return (
    <div className={styles.section_main}>
      <header className={styles.header}>
        {alias ? (
          <div className={`${styles.quick_action_widget} ${styles.header_poins_wrap}`}>
            <span className={styles.widget_tag}>⚡ ТРЕНЕР РЕКОМЕНДУЕТ</span>
            
            <div className={styles.widget_body}>
              {iconSrc && (
                <div className={styles.widget_icon_wrap}>
                  <img src={iconSrc} alt={title} className={styles.widget_icon} />
                </div>
              )}
              <div className={styles.widget_info}>
                <h4 className={styles.widget_title}>{title}</h4>
                <p className={styles.widget_desc}>{description}</p>
              </div>
            </div>

            {/* 📌 Навигационная обертка для аккуратной кнопки-пилюли в углу */}
            <div className={styles.widget_footer}>
              <button 
                className={styles.widget_pill_btn}
                onClick={handleStartExercise}
              >
                Старт
              </button>
            </div>
          </div>
        ) : (
          <div className={`${styles.quick_action_widget} ${styles.header_poins_wrap}`}>
            <span className={styles.widget_tag}>🎯 ЦЕЛЬ ЗАКРЫТА</span>
            <p className={styles.widget_desc} style={{ margin: '8px 0' }}>
              Все задания на сегодня успешно выполнены! Возвращайся завтра.
            </p>
          </div>
        )}
      </header>
      
      {/* <div className={styles.line_border}></div> */}
      <div className={styles.border}></div>
      <DashboardBlock />
      <div className={styles.border}></div>
      <DailyChallengesBlock />
      <div className={styles.border}></div>
      <ExerciseCatalogBlock />
      <div className={styles.border}></div>
      <CoursesBannerBlock />
      <div className={styles.border}></div>
      <ActivityBlock />
      <div className={styles.border}></div>
      <LeaderboardShortBlock />
      <div className={styles.border}></div>
    </div>
  )
}

export default MainPage
