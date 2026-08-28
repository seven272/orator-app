import React from 'react'

import { useSelector } from 'react-redux'

import DailyTasksList from '../../components/daily-tasks-list/DailyTasksList'
import DailyHeader from './daily-header/DailyHeader'
import DailyCalendar from './daily-calendar/DailyCalendar'
import styles from './ExercisesDailyPage.module.css'

const ExercisesDailyPage = () => {
  const completedDays = useSelector(
    (state) => state.profile?.user?.completed_days || [],
  )
  return (
    <div className={styles.screen_container}>
      <DailyHeader />
      <DailyCalendar activeDays={completedDays} />
      <DailyTasksList />
    </div>
  )
}

export default ExercisesDailyPage
