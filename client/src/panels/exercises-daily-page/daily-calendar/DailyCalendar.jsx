import React from 'react'
import { useSelector } from 'react-redux'
import styles from './DailyCalendar.module.css'

export const DailyCalendar = ({ activeDays = [] }) => {
  // Смотрим, находится ли приложение в демо-режиме для гостей
  const { isDemo } = useSelector((state) => state.daily || {})

  const today = new Date()
  const currentDayOfWeek = today.getDay()
  const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - todayIndex)

  const weekDaysData = daysOfWeek.map((dayName, index) => {
    const dayDate = new Date(startOfWeek)
    dayDate.setDate(startOfWeek.getDate() + index)

    const dayOfMonth = dayDate.getDate()
    const year = dayDate.getFullYear()
    const month = String(dayDate.getMonth() + 1).padStart(2, '0')
    const dayOfMonthNum = String(dayDate.getDate()).padStart(2, '0')
    const dateString = `${year}-${month}-${dayOfMonthNum}`

    const isCompleted = activeDays.includes(dateString)
    const isToday = index === todayIndex

    return { dayName, dayOfMonth, isCompleted, isToday }
  })

  // 🎯 Динамический текст для стрика в зависимости от статуса юзера
  const getStreakMessage = () => {
    if (isDemo) return '✨ Войди, чтобы начать стрик!'
    if (activeDays.length === 0) return '🚀 Сделай первое упражнение сегодня!'
    return '🔥 Ваш стрик в порядке'
  };

  return (
    <div className={styles.calendar_wrapper}>
      <div className={styles.calendar_title_block}>
        <span className={styles.calendar_title}>Прогресс недели</span>
        <span className={styles.streak_counter}>
          {getStreakMessage()}
        </span>
      </div>

      <div className={styles.week_days_grid}>
        {weekDaysData.map((day, index) => {
          const dayClasses = [
            styles.day_cell,
            day.isToday ? styles.is_today : '',
            day.isCompleted ? styles.is_completed : '',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <div key={index} className={dayClasses}>
              <span className={styles.day_name}>{day.dayName}</span>
              <div className={styles.day_circle}>
                {day.isCompleted ? '✓' : day.dayOfMonth}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DailyCalendar
