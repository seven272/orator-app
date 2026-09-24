import React, { useEffect } from 'react'
import { FaGift } from 'react-icons/fa'
import styles from './WeeklyPrizeModal.module.css'

const WeeklyPrizeModal = ({ isOpen, onClose, prizeData }) => {
  // Управление скроллом фона и клавишей Esc через useEffect
  useEffect(() => {
    if (!isOpen) return

    // 1. Блокируем прокрутку основной страницы
    const originalStyle = window.getComputedStyle(
      document.body,
    ).overflow
    document.body.style.overflow = 'hidden'

    // 2. Обработчик нажатия на клавишу Esc
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    // Функция очистки: срабатывает при закрытии или размонтировании модалки
    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !prizeData) return null

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.modal_sparkles}>✨ 🎉 ✨</span>
        <h3 className={styles.modal_title}>
          Поздравляем с наградой!
        </h3>
        <p className={styles.modal_subtitle}>
          Из еженедельного сундука вам выпадает:
        </p>

        <div className={styles.prize_badge_display}>
          <div className={styles.prize_gift_container}>
            <FaGift size={38} className={styles.prize_icon} />
          </div>
          <span className={styles.prize_gift_title}>
            {prizeData.title}
          </span>
        </div>

        <p className={styles.modal_notice}>
          Предмет автоматически добавлен в ваш профиль
        </p>
        <button className={styles.close_modal_btn} onClick={onClose}>
          Отлично, спасибо!
        </button>
      </div>
    </div>
  )
}

export default WeeklyPrizeModal
