import React, { useEffect } from 'react'
import styles from './Modal.module.css'

const Modal = ({ active, onClose, children }) => {
  // закрываем модальное окно при нажатии на ESC
   useEffect(() => {
    // 💡 Проверяем: если модалка активна — выключаем скролл, если закрыта — возвращаем дефолтный
    if (active) {
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

    // Функция очистки (вызовется при размонтировании или при изменении пропса active)
    return () => { 
      document.body.style.overflow = 'unset' // ✅ Гарантированно возвращаем скролл при любом исходе
      window.removeEventListener('keydown', closeModal)
    }
  }, [active]) 

  return (
    <div
      className={
        active ? `${styles.modal} ${styles.active}` : styles.modal
      }
      onClick={onClose}
    >
      <div
        className={
          active
            ? `${styles.modal__content} ${styles.active}`
            : styles.modal__content
        }
        onClick={(evt) => evt.stopPropagation()}
      >
        {children}
        <span className={styles.close} onClick={onClose}>
          &times;
        </span>
      </div>
    </div>
  )
}

export default Modal
