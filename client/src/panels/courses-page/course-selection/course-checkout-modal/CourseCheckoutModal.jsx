import React, { useEffect } from 'react'
import styles from './CourseCheckoutModal.module.css'

const CourseCheckoutModal = ({ active, onClose, courseTitle, isBuying, onConfirm }) => {
  // Блокируем скролл страницы при открытии окна
  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [active])

  if (!active) return null

  return (
    <div 
      className={`${styles.custom_backdrop} ${styles.backdrop_active}`} 
      onClick={() => !isBuying && onClose()}
    >
      <div 
        className={`${styles.custom_modal_body} ${styles.body_active}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {!isBuying && <span className={styles.custom_close_btn} onClick={onClose}>&times;</span>}
        
        <div className={styles.checkout_modal_content}>
          <h3 className={styles.checkout_main_title}>🛒 Оформление интенсива</h3>
          <p className={styles.checkout_hint}>
            Вы приобретаете доступ к обучающему треку до момента его полного прохождения или 5 провальных попыток экзамена:
          </p>
          <h4 className={styles.checkout_course_title}>{courseTitle}</h4>
          
          <div className={styles.checkout_benefits}>
            <div>✓ Все 5 учебных шагов (Теория, Практика, ИИ)</div>
            <div>✓ Включены реплики нейросети GigaChat-2</div>
            <div>✓ Награда +1000 XP и 100 монет спикера</div>
          </div>

          <div className={styles.checkout_price_tag}>
            <span className={styles.checkout_price_label}>К оплате:</span>
            <div className={styles.checkout_price_values}>
              <span className={styles.checkout_old_price}>990 ₽</span>
              <span className={styles.checkout_actual_price}>0 ₽ <small>Тест</small></span>
            </div>
          </div>

          <button
            type="button"
            className={styles.checkout_confirm_btn}
            onClick={onConfirm}
            disabled={isBuying}
          >
            {isBuying ? 'Подключение доступа...' : 'Оплатить через ЮMoney'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CourseCheckoutModal
