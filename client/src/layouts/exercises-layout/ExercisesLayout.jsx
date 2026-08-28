import React from 'react'
import { Outlet } from 'react-router-dom'
import styles from './ExercisesLayout.module.css'

const ExercisesLayout = () => {
  return (
    <div className={styles.exercises_theme_bg}>
      {/* Сюда будут подставляться страницы упражнений */}
      <Outlet />
    </div>
  )
}

export default ExercisesLayout
