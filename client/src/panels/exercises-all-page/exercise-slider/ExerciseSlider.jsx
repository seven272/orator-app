import React, { useRef, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaChevronLeft, FaChevronRight, FaArrowRight } from 'react-icons/fa'

import styles from './ExerciseSlider.module.css'
import ExercisePreview from '../../../components/exercise-preview/ExercisePreview'

const ExerciseSlider = ({ titleLvl, levelKey, exList = [], onOpenPremium, onOpenTheory }) => {
  const navigate = useNavigate()
  const sliderRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Проверка границ скролла
  const checkScrollBounds = () => {
    const container = sliderRef.current
    if (!container) return

    const { scrollLeft, clientWidth, scrollWidth } = container
    setCanScrollLeft(scrollLeft > 1)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }

  useEffect(() => {
    checkScrollBounds()
    const container = sliderRef.current
    if (!container) return

    container.addEventListener('scroll', checkScrollBounds)
    window.addEventListener('resize', checkScrollBounds)

    return () => {
      container.removeEventListener('scroll', checkScrollBounds)
      window.removeEventListener('resize', checkScrollBounds)
    }
  }, [exList])

  const handleScroll = (direction) => {
    const container = sliderRef.current
    if (!container) return

    const firstItem = container.firstElementChild
    if (!firstItem) return

    const itemWidth = firstItem.offsetWidth
    const gap = parseFloat(getComputedStyle(container).gap) || 12
    const scrollAmount = direction === 'left' ? -(itemWidth + gap) : itemWidth + gap

    container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }

  const handleGoToLevel = () => {
    navigate(`/exercises/${levelKey}`)
  }

  return (
    <div className={styles.level_section}>
      <div className={styles.header_block}>
        <span className={styles.title_block}>{titleLvl}</span>
        <button className={styles.see_all_btn} onClick={handleGoToLevel}>
          <span>Все</span>
          <span className={styles.counter}>{exList.length}</span>
          <FaArrowRight size={12} className={styles.arrow_icon} />
        </button>
      </div>

      <div className={styles.slider_container}>
        <button
          className={`${styles.nav_btn} ${styles.btn_left}`}
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          aria-label="Назад"
        >
          <FaChevronLeft size={14} />
        </button>

        <div className={styles.carousel_wrapper} ref={sliderRef}>
          {exList.map((ex) => (
            <ExercisePreview
              key={ex.alias}
              exData={ex}
              onOpenPremium={onOpenPremium}
              onOpenTheory={onOpenTheory}
            />
          ))}
        </div>

        <button
          className={`${styles.nav_btn} ${styles.btn_right}`}
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          aria-label="Вперед"
        >
          <FaChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default ExerciseSlider
