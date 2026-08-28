import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaArrowRight,
} from 'react-icons/fa'

import CourseHistoryList from './course-history-list/CourseHistoryList'
import CourseHistorySummary from './course-history-summary/CourseHistorySummary'
import styles from './CourseHistory.module.css'

const CourseHistory = ({ historyList }) => {
  const navigate = useNavigate()
  const [showList, setShowList] = useState(false)

  // 1. Отработка пустого состояния с редиректом через VK Router
  if (!historyList || historyList.length === 0) {
    return (
      <div className={styles.card}>
        <h3 className={styles.card_title}>
          <FaHistory className={styles.icon_history} /> Архив
          пройденных курсов
        </h3>
        <div className={styles.empty_wrapper}>
          <p className={styles.empty_text}>
            У вас пока нет завершенных или архивных курсов.
          </p>
          <button
            className={styles.route_btn}
            onClick={() => navigate('/courses')}
          >
            Перейти к курсам
            <FaArrowRight size={18} />
          </button>
        </div>
      </div>
    )
  }
  const handleShowList = () => {
    setShowList((prev) => !prev)
  }
  // --- РАСЧЕТ СВОДНОЙ СТАТИСТИКИ ---
  // Каждый курс в архиве уже считается завершенным
  const totalCompletedCourses = historyList.length

  // Считаем успешные и проваленные попытки по всем историям всех курсов
  let totalSuccessAttempts = 0
  let totalFailedAttempts = 0

  historyList.forEach((course) => {
    if (course.history && course.history.length > 0) {
      course.history.forEach((attempt) => {
        if (attempt.status === 'completed') {
          totalSuccessAttempts++
        } else {
          totalFailedAttempts++
        }
      })
    }
  })

  return (
    <div className={styles.card}>
      {/* Шапка блока */}
      <h3 className={styles.card_title}>
        <FaHistory className={styles.icon_history} /> Архив пройденных
        курсов
      </h3>

      <CourseHistorySummary
        completedCourses={totalCompletedCourses}
        successAttempts={totalSuccessAttempts}
        failedAttempts={totalFailedAttempts}
      />
      <div onClick={handleShowList} className={styles.box_nav_list}>
        <span className={styles.text_nav_list}>
          {showList ? 'свернуть' : 'смотреть детали'}
        </span>
        {showList ? (
          <FaChevronUp size={15} className={styles.icon_nav_list} />
        ) : (
          <FaChevronDown size={15} className={styles.icon_nav_list} />
        )}
      </div>

      {showList && <CourseHistoryList historyList={historyList} />}
    </div>
  )
}

export default CourseHistory
