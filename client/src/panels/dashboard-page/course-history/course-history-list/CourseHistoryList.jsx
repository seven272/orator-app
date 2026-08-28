import React, { useState } from 'react'
import { FaChevronDown, FaChevronUp, FaRobot } from 'react-icons/fa'

import styles from './CourseHistoryList.module.css'

// Масштабируемый объект с алиасами для названий курсов
const COURSE_NAMES = {
  pitch_master: 'Питч на миллион',
  self_pitch_pro: 'Личный бренд: самопрезентация на миллион',
  hr_storm: 'HR-штурм: искусство собеседований',
  party_charisma: 'Харизма нетворкинга: свой в любой компании',
  social_shield:
    'Психологический щит: ответ на агрессию и манипуляции',
  media_speaker: 'Оратор в кадре: магия публичных выступлений',
  toast_master: 'Король застолья: искусство тостов и ярких речей',
  story_master: 'Магия истории: искусство увлекательного рассказа',
}

const CourseHistoryList = ({ historyList }) => {
  const [expandedId, setExpandedId] = useState(null)
  // Получаем человекочитаемое название курса по словарю
  const getCourseTitle = (code) => {
    return COURSE_NAMES[code] || code
  }

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Дата неизвестна'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return 'Дата неизвестна'

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className={styles.courses_loop}>
      {historyList.map((course, cIndex) => (
        <div
          key={course._id || course.courseCode || cIndex}
          className={styles.course_section}
        >
          {/* Красивое название курса по словарю */}
          <div className={styles.course_meta_header}>
            <span className={styles.course_code_title}>
              {getCourseTitle(course.courseCode)}
            </span>
            <span
              className={`${styles.course_status_badge} ${course.status === 'completed' ? styles.status_success : styles.status_error}`}
            >
              {course.status === 'completed' ? 'Изучен' : 'Архив'}
            </span>
          </div>

          {/* Хронология попыток внутри этого курса */}
          <div className={styles.timeline}>
            {course.history && course.history.length > 0 ? (
              course.history.map((item, index) => {
                const isCompleted = item.status === 'completed'
                const examData = item.blocksProgress?.exam
                const isExpanded = expandedId === item._id
                const attemptId = item._id || `${cIndex}-${index}`

                return (
                  <div
                    key={attemptId}
                    className={`${styles.history_item} ${isExpanded ? styles.item_active : ''}`}
                  >
                    {/* Кликабельная шапка попытки */}
                    <div
                      className={styles.item_header}
                      onClick={() => toggleExpand(attemptId)}
                    >
                      <div className={styles.meta_info}>
                        <span className={styles.attempt_number}>
                          Попытка №{course.history.length - index}
                        </span>
                        <span className={styles.finish_date}>
                          {formatDate(item.finishedAt)}
                        </span>
                      </div>

                      <div className={styles.score_zone}>
                        <span
                          className={`${styles.status_text} ${isCompleted ? styles.status_success : styles.status_error}`}
                        >
                          {isCompleted ? 'Успешно' : 'Не сдано'}
                        </span>
                        <span className={styles.score_value}>
                          {examData?.bestScore || 0}
                          <span className={styles.score_max}>
                            /100
                          </span>
                        </span>
                        <span className={styles.arrow_icon}>
                          {isExpanded ? (
                            <FaChevronUp />
                          ) : (
                            <FaChevronDown />
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Разворачиваемые детали от ИИ */}
                    {isExpanded && (
                      <div className={styles.item_details}>
                        <div className={styles.detail_row}>
                          <span className={styles.detail_label}>
                            Использовано попыток экзамена:
                          </span>
                          <strong className={styles.detail_value}>
                            {examData?.attemptsCount || 0} из 5
                          </strong>
                        </div>

                        {examData?.aiFeedback && (
                          <div className={styles.ai_feedback_block}>
                            <div className={styles.feedback_header}>
                              <FaRobot className={styles.icon_ai} />
                              <span className={styles.feedback_label}>
                                Вердикт ИИ:
                              </span>
                            </div>
                            <p className={styles.feedback_text}>
                              {examData.aiFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className={styles.no_history_text}>
                История попыток по этому курсу пуста.
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default CourseHistoryList
