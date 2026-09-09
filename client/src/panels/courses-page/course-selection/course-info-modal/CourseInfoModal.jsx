import React from 'react'
import styles from './CourseInfoModal.module.css'

const CourseInfoModal = ({ info, closeModal }) => {
 

  return (
    <div
      className={`${styles.custom_backdrop} ${styles.backdrop_active}`}
      onClick={closeModal}
    >
      <div
        className={`${styles.custom_modal_body} ${styles.body_active}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={styles.custom_close_btn}
          onClick={closeModal}
        >
          &times;
        </span>
        <h3 className={styles.modal_info_title}>{info.title}</h3>
        <p className={styles.modal_info_text}>{info.content}</p>
      </div>
    </div>
  )
}

export default CourseInfoModal
