import React from 'react'
import { useSelector } from 'react-redux'
import { FaBolt, FaStar, FaGift } from 'react-icons/fa' // Импортируем иконки
import styles from './DailyHeader.module.css'

export const DailyHeader = () => {
  const { isDemo } = useSelector((state) => state.daily || {})
  const userStreak = useSelector((state) => state.profile?.user?.streak?.current || 0)

  const isSunday = new Date().getDay() === 0
  const hasMultiplier = userStreak >= 5

  const getDescription = () => {
    if (isDemo) {
      return 'Занимайтесь риторикой каждый день без пропусков! Создайте личный профиль, чтобы удваивать очки и монеты за задания дня, активировать повышенный доход во всех тренажерах и открыть Призовой Сундук.'
    }
    if (isSunday) {
      return 'Сегодня воскресенье — финальный день! Выполните сегодняшнюю тренировку, чтобы успешно завершить неделю идеальной дисциплины и получить доступ к Призовому Сундуку!'
    }
    return 'Не пропускайте дни тренировок! Каждое выполненное задание дня удваивает ваши награды, а занятия с понедельника по воскресенье откроют доступ к Призовому Сундуку.'
  }

  return (
    <div className={styles.header_wrapper}>
      {/* Шапка: Название раздела + Дата */}
      <div className={styles.header_top_line}>
        <h1 className={styles.title}>Задания дня</h1>
        <span className={styles.date_badge}>
          {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
        </span>
      </div>

      {/* Главный блок карточки */}
      <div className={styles.header_card}>
        <div className={styles.main_content}>
          <p className={styles.description}>{getDescription()}</p>

          {/* Информационная панель главных выгод */}
          <div className={styles.status_panel}>
            
            {/* Блок 1: Повышающий коэффициент */}
            <div className={`${styles.status_item} ${hasMultiplier && !isDemo ? styles.active_benefit : ''}`}>
              <div className={`${styles.status_icon} ${styles.icon_zap}`}>
                <FaBolt size={20} />
              </div>
              <div className={styles.status_info}>
                <span className={styles.status_value}>Доход 1.2х</span>
                <span className={styles.status_label}>
                  {hasMultiplier && !isDemo ? 'Активирован на всё' : 'От 5 дней занятий'}
                </span>
              </div>
            </div>

            <div className={styles.status_divider}></div>

            {/* Блок 2: Двойные награды */}
            <div className={styles.status_item}>
              <div className={`${styles.status_icon} ${styles.icon_star}`}>
                <FaStar size={20} />
              </div>
              <div className={styles.status_info}>
                <span className={styles.status_value}>Очки и монеты х2</span>
                <span className={styles.status_label}>в заданиях дня</span>
              </div>
            </div>

            <div className={styles.status_divider}></div>

            {/* Блок 3: Главная цель недели */}
            <div className={styles.status_item}>
              <div className={`${styles.status_icon} ${styles.icon_gift} ${isSunday && !isDemo ? styles.gift_pulse : ''}`}>
                <FaGift size={20} />
              </div>
              <div className={styles.status_info}>
                <span className={`${styles.status_value} ${isSunday && !isDemo ? styles.text_pulse : ''}`}>
                  {isSunday && !isDemo ? 'Можно открыть!' : 'Сундук в воскресенье'}
                </span>
                <span className={styles.status_label}>Неделя без пропусков</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyHeader
