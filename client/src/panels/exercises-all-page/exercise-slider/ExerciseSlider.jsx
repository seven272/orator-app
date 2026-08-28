import React, { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaChevronLeft,
  FaChevronRight,
  FaArrowRight,
} from 'react-icons/fa'

import styles from './ExerciseSlider.module.css'
import ExercisePreview from '../../../components/exercise-preview/ExercisePreview'

const ExerciseSlider = ({ titleLvl, levelKey, exList = [] }) => {
 const navigate = useNavigate()
  const sliderRef = useRef(null)

  // Функция для плавного скролла влево/вправо
  const handleScroll = (direction) => {
    if (sliderRef.current) {
      // Ширина карточки (280px) + gap (20px) = 300px шаг скролла
      const scrollAmount = direction === 'left' ? -300 : 300
      sliderRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  const handleGoToLevel = () => {
    navigate(`/exercises/${levelKey}`)
  }

  return (
    <div className={styles.level_section}>
      {/* Шапка слайдера со ссылкой перехода */}
      <div className={styles.header_block}>
        <h3 className={styles.title_block}>{titleLvl}</h3>
        <button
          className={styles.see_all_btn}
          onClick={handleGoToLevel}
        >
          <span>Все</span>
          <span className={styles.counter}>{exList.length}</span>
          <FaArrowRight size={12} className={styles.arrow_icon} />
        </button>
      </div>

      {/* Контейнер со слайдером и стрелками */}
      <div className={styles.slider_container}>
        <button
          className={`${styles.nav_btn} ${styles.btn_left}`}
          onClick={() => handleScroll('left')}
          aria-label="Назад"
        >
          <FaChevronLeft size={14} />
        </button>

        <div className={styles.carousel_wrapper} ref={sliderRef}>
          {exList.map((ex) => (
            <ExercisePreview key={ex.alias} exData={ex} />
          ))}
        </div>

        <button
          className={`${styles.nav_btn} ${styles.btn_right}`}
          onClick={() => handleScroll('right')}
          aria-label="Вперед"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default ExerciseSlider
