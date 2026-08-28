import { useState } from 'react'

import styles from './TheoryData.module.css'
import DetailModalTheoryCourse from '../../../../../UI/detail-modal-theory-course/DetailModalTheoryCourse'

const TheoryData = ({
  currentSlide,
  theorySlides,
  onPrev,
  onNext,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className={styles.card_content}>
      <span className={styles.badge_step}>
        Материал: {currentSlide + 1} из {theorySlides.length}
      </span>
      <h2 className={styles.slide_title}>
        {theorySlides[currentSlide].title}
      </h2>
      <p className={styles.slide_text}>
        {theorySlides[currentSlide].text}
      </p>

      {/* Новая кнопка "Подробнее" */}
      <button
        className={styles.details_trigger_button}
        onClick={() => setIsModalOpen(true)}
      >
        Развернуть материал 💡
      </button>

      <div className={styles.navigation_zone}>
        <button
          className={styles.nav_button_secondary}
          onClick={onPrev}
          disabled={currentSlide === 0}
        >
          Назад
        </button>
        <button
          className={styles.nav_button_primary}
          onClick={onNext}
        >
          Далее
        </button>
      </div>

      {/* Подключаем модалку */}
      <DetailModalTheoryCourse
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={theorySlides[currentSlide].title}
      >
        {theorySlides[currentSlide].details}
      </DetailModalTheoryCourse>
    </div>
  )
}

export default TheoryData
