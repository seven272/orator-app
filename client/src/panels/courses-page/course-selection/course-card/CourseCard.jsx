import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CourseCheckoutModal from '../../../../components/modal/course-checkout-modal/CourseCheckoutModal'
import styles from './CourseCard.module.css'

const CourseCard = ({ course, isLastOdd, isPurchased }) => {
  const navigate = useNavigate()


  // Локальные стейты для управления модалкой оплаты внутри этой карточки
  const [openCheckout, setOpenCheckout] = useState(false)
 

  // Главный хэндлер клика по кнопке действия
  const handleActionClick = (e) => {
    e.stopPropagation()
    if (isPurchased) {
      navigate(`/course/${course.code}`)
    } else {
      setOpenCheckout(true) // Открываем модалку чекаута
    }
  }

  // Хэндлер подтверждения покупки внутри модального окна


  return (
    <>
      <div
        className={`
          ${styles.course_card} 
          ${isLastOdd ? styles.course_card_fullwidth : ''} 
          ${!isPurchased ? styles.card_unbought : ''}
        `}
        onClick={() =>
          isPurchased ? navigate(`/course/${course.code}`) : null
        }
      >
        <div className={styles.card_header}>
          <span className={styles.course_tag}>{course.tag}</span>

          <div className={styles.course_icon_container}>
            <img
              src={course.icon}
              alt={course.title}
              className={styles.course_png_image}
            />
            {!isPurchased && (
              <div className={styles.card_lock_badge}>🔒</div>
            )}
          </div>
        </div>

        <h3 className={styles.course_title}>{course.title}</h3>
        <p className={styles.course_text}>{course.description}</p>

        <button
          type="button"
          className={`${styles.card_action_button} ${isPurchased ? styles.active_action_btn : styles.buy_action_btn}`}
          onClick={handleActionClick}
        >
          {isPurchased
            ? 'Перейти к обучению'
            : 'Купить интенсив (0 ₽)'}
        </button>
      </div>

      {/* Модалка чекаута, привязанная к конкретной карточке */}
      <CourseCheckoutModal
        active={openCheckout}
        onClose={() => setOpenCheckout(false)}
        courseTitle={course.title}
        courseCode={course.code}
       
      />
    </>
  )
}

export default CourseCard
