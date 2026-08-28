import React from 'react'

import ExerciseSlider from './exercise-slider/ExerciseSlider'
import styles from './ExercisesAllPage.module.css'
import { All_EXERCISES } from '../../assets/mocks/exercises'

const ExercisesAllPage = () => {
  return (
    <div className={styles.main_all_ex}>
      <ExerciseSlider
        titleLvl="Уровень 1: База"
        levelKey="level1"
        exList={All_EXERCISES.level1}
      />
      <ExerciseSlider
        titleLvl="Уровень 2: Продвинутый"
        levelKey="level2"
        exList={All_EXERCISES.level2}
      />
      <ExerciseSlider
        titleLvl="Уровень 3: Эксперт"
        levelKey="level3"
        exList={All_EXERCISES.level3}
      />
    </div>
  )
}

export default ExercisesAllPage
