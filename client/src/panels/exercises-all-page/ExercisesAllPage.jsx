import React, { useState } from 'react'

import ExerciseSlider from './exercise-slider/ExerciseSlider'
import styles from './ExercisesAllPage.module.css'
import { All_EXERCISES } from '../../assets/mocks/exercises'
import TheoryContent from '../../components/theory-content/TheoryContent'
import PremiumModal from '../../components/premium-modal/PremiumModal'
import Modal from '../../UI/modal/Modal'

const ExercisesAllPage = () => {
  const [showModalPremium, setShowModalPremium] = useState(false)
  const [showModalTheory, setShowModalTheory] = useState(false)
  const [activeExercise, setActiveExercise] = useState(null)

  const handleOpenPremium = () => {
    setShowModalPremium(true)
  }

  const handleOpenTheory = (exData) => {
    setActiveExercise(exData)
    setShowModalTheory(true)
  }
  
  return (
    <div className={styles.main_all_ex}>

      <ExerciseSlider
        titleLvl="Уровень 1: База"
        levelKey="level1"
        exList={All_EXERCISES.level1}
        onOpenPremium={handleOpenPremium}
        onOpenTheory={handleOpenTheory}
      />
      <ExerciseSlider
        titleLvl="Уровень 2: Продвинутый"
        levelKey="level2"
        exList={All_EXERCISES.level2}
        onOpenPremium={handleOpenPremium}
        onOpenTheory={handleOpenTheory}
      />
      <ExerciseSlider
        titleLvl="Уровень 3: Эксперт"
        levelKey="level3"
        exList={All_EXERCISES.level3}
        onOpenPremium={handleOpenPremium}
        onOpenTheory={handleOpenTheory}
      />

      <Modal
        active={showModalTheory}
        onClose={() => {
          setShowModalTheory(false)
          setActiveExercise(null)
        }}
      >
        {activeExercise && (
          <TheoryContent
            alias={activeExercise.alias}
            onClose={() => {
              setShowModalTheory(false)
              setActiveExercise(null)
            }}
          />
        )}
      </Modal>

      <PremiumModal
        active={showModalPremium}
        onClose={() => setShowModalPremium(false)}
      />
    </div>
  )
}

export default ExercisesAllPage
