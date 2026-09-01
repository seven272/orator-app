import React from 'react'
import { useSelector } from 'react-redux'
import styles from './DailyHeader.module.css'

export const DailyHeader = () => {
  // Узнаем, авторизован ли пользователь (демо-режим)
  const { isDemo } = useSelector((state) => state.daily || {})

  return (
    <div className={styles.header_wrapper}>
      {/* Верхняя линия: Заголовок + Дата */}
      <div className={styles.header_top_line}>
        <h2 className={styles.title}>Задания дня</h2>
        <span className={styles.date_badge}>
          {new Date().toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
          })}
        </span>
      </div>

      {/* Описание и бонусы */}
      <div className={styles.header_content}>
        <div className={styles.header_text_block}>
          <p className={styles.description}>
            {isDemo ? (
              // 💡 Пояснение для гостя: вовлекаем в механику приложения
              'Регулярные короткие тренировки для уверенной речи. Занимайтесь каждый день без пропусков, чтобы запустить серию активности и получать двойной опыт.'
            ) : (
              // 💡 Пояснение для авторизованного: давим на регулярность
              'Выполняйте упражнения сегодня, чтобы не прерывать вашу серию занятий. Ежедневная практика закрепляет навыки риторики быстрее.'
            )}
          </p>
          
          <div className={styles.bonus_badges}>
            {/* 🚀 Заменили непонятный "Стрик" на "Дни подряд" */}
            <span className={styles.badge}>
              {isDemo ? '🔥 Дней подряд: 0' : '🔥 Серия без пропусков +1'}
            </span>
            <span className={`${styles.badge} ${styles.badge_gold}`}>
              ⭐ Опыт x2 за регулярность
            </span>
          </div>
        </div>
        <div className={styles.header_visual}>
          <span className={styles.main_icon}>🎯</span>
        </div>
      </div>
    </div>
  )
}

export default DailyHeader
