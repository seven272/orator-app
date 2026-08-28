import React, { useEffect } from 'react'
import styles from './DetailModalTheoryCourse.module.css'

const DetailModalTheoryCourse = ({ isOpen, onClose, title, children }) => {
  // Блокируем скролл основной страницы при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    const closeModal = (evt) => {
      if (evt.key === 'Escape') {
        onClose()
      } 
    }
    window.addEventListener('keydown', closeModal)
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', closeModal)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modal_header}>
          <h3 className={styles.modal_title}>{title}</h3>
          <button
            className={styles.modal_close_button}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
        <div className={styles.modal_body}>{children}</div>
      </div>
    </div>
  )
}

export default DetailModalTheoryCourse
