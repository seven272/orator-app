import React from 'react'
import styles from './DailyHeader.module.css'

export const DailyHeader = () => {
  return (
    <div className={styles.header_wrapper}>
      {/* Верхняя линия: Заголовок + Дата (из ваших старых стилей) */}
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
            Регулярные испытания для прокачки харизмы. Выполняйте сегодня, чтобы забрать повышенные награды:
          </p>
          <div className={styles.bonus_badges}>
            <span className={styles.badge}>🔥 Стрик дней +1</span>
            <span className={styles.badge}>⭐ Опыт x2</span>
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
