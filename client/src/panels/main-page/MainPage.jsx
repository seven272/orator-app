import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { fetchDailyTasks } from '../../redux/slices/dailySlice'
import styles from './MainPage.module.css'

import PromoBannerBlock from './promo-banner-block/PromoBannerBlock' // Импортируем новый баннер
import DashboardBlock from './dashboard-block/DashboardBlock'
import DailyChallengesBlock from './daily-challenges-block/DailyChallengesBlock'
import ExerciseCatalogBlock from './exercise-catalog-block/ExerciseCatalogBlock'
import LeaderboardShortBlock from './leaderboard-short-block/LeaderboardShortBlock'
import ActivityBlock from './activity-block/ActivityBlock'
import CoursesBannerBlock from './courses-banner-block/CoursesBannerBlock'


const MainPage = () => {
  const dispatch = useDispatch()


  useEffect(() => {
    dispatch(fetchDailyTasks())
  }, [dispatch])

  return (
    <div className={styles.section_main}>
      {/* Наш новый изолированный компонент баннера */}
      <PromoBannerBlock />

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
