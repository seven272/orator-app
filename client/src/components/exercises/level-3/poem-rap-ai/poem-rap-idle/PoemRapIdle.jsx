import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './PoemRapIdle.module.css' // Стили в точности повторяют логику и нейминг PoemTongueIdle

const PoemRapIdle = ({
  onRefreshTopic,
  onShowTheory,
  rapData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка открытия теории */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      {/* Заголовок с темой трека и кнопкой обновления карточки */}
      <span className={styles.screen_idle_title}>
        {rapData.topic}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Обертка карточки (display: block, text-align: center и полупрозрачный синий фон из Трибуны) */}
      <div className={styles.idle_box}>
        {/* Вывод ориентиров для читки и флоу */}
        <div className={styles.focus_sounds_container}>
          <span className={styles.focus_label}>Ориентиры флоу:</span>
          <div className={styles.badges_list}>
            {rapData.rhythmAnchors.map((anchor, index) => (
              <span key={index} className={styles.sound_badge}>
                {anchor}
              </span>
            ))}
          </div>
        </div>

        {/* Текст стихотворения для рэп-читки */}
        <p className={styles.tongue_text_block}>
          {rapData.textToRead}
        </p>
      </div>

      {/* Кнопка старта в подвале */}
      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!rapData}
        >
          Приступить
        </button>
      </div>
    </div>
  )
}

export default PoemRapIdle
