// frontend/src/components/ExamBlock/TheoryReviewMode.jsx
import React, { useState } from 'react'
import TheoryData from '../theory-block/theory-data/TheoryData'
import styles from './TheoryReviewMode.module.css'

const TheoryReviewMode = ({
  slides,
  onBack,
  backLabel = 'Закрыть',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
    }
  }
  return (
    <div className={styles.review_mode_wrapper}>
      <div className={styles.review_header}>
        <button className={styles.back_to_exam_btn} onClick={onBack}>
        ✖️ {backLabel}
        </button>
        {/* <span className={styles.review_title}>Повторение теории</span> */}
      </div>

      <TheoryData
        currentSlide={currentSlide}
        theorySlides={slides}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}

export default TheoryReviewMode
