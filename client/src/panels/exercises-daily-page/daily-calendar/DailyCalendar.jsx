import React from 'react'
import styles from './DailyCalendar.module.css'

export const DailyCalendar = ({ activeDays = [] }) => {
  console.log(activeDays)
  // Получаем текущую дату для определения "сегодня"
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 - вс, 1 - пн, ... 6 - сб

  // Корректируем индекс, чтобы неделя начиналась с понедельника (0 - пн, 6 - вс)
  const todayIndex = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  // Вычисляем дату начала текущей недели (понедельника)
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

    // Проверяем выполнение и совпадение с сегодняшним днем
    const isCompleted = activeDays.includes(dateString)
    const isToday = index === todayIndex

    return {
      dayName,
      dayOfMonth,
      isCompleted,
      isToday,
    }
  })

  return (
    <div className={styles.calendar_wrapper}>
      <div className={styles.calendar_title_block}>
        <span className={styles.calendar_title}>Прогресс недели</span>
        <span className={styles.streak_counter}>
          🔥 Ваш стрик в порядке
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
