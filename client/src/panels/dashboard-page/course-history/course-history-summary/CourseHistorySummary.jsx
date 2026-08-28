import React from 'react'

import {
  FaTrophy,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa'

import styles from './CourseHistorySummary.module.css'

const CourseHistorySummary = ({
  completedCourses,
  successAttempts,
  failedAttempts,
}) => {
  return (
    <div className={styles.summary_panel}>
      <div className={styles.summary_item}>
        <FaTrophy
          size={18}
          className={styles.summary_icon_completed}
        />
        <div className={styles.summary_info}>
          <span className={styles.summary_value}>
            {completedCourses}
          </span>
          <span className={styles.summary_label}>
            Пройдено курсов
          </span>
        </div>
      </div>
      <div className={styles.summary_item}>
        <FaCheckCircle
          size={18}
          className={styles.summary_icon_success}
        />
        <div className={styles.summary_info}>
          <span className={styles.summary_value}>
            {successAttempts}
          </span>
          <span className={styles.summary_label}>
            Успешных попыток
          </span>
        </div>
      </div>
      <div className={styles.summary_item}>
        <FaTimesCircle
          size={18}
          className={styles.summary_icon_failed}
        />
        <div className={styles.summary_info}>
          <span className={styles.summary_value}>
            {failedAttempts}
          </span>
          <span className={styles.summary_label}>
            Провалено попыток
          </span>
        </div>
      </div>
    </div>
  )
}

export default CourseHistorySummary
