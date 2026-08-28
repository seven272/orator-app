import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './PoemTongueIdle.module.css'

const PoemTongueIdle = ({
  onRefreshTopic,
  onShowTheory,
  tongueData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка теории */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      {/* Заголовок с темой и возможностью обновить скороговорку */}
      <span className={styles.screen_idle_title}>
        {tongueData.topic}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Обертка карточки сценария (центрирование через display: block и text-align: center в CSS) */}
      <div className={styles.idle_box}>
        {/* Вывод фокусных звуков раунда */}
        <div className={styles.focus_sounds_container}>
          <span className={styles.focus_label}>Фокусные звуки:</span>
          <div className={styles.badges_list}>
            {tongueData.focusSounds.map((sound, index) => (
              <span key={index} className={styles.sound_badge}>
                {sound}
              </span>
            ))}
          </div>
        </div>

        {/* Целевой текст скороговорки для чтения с листа */}
        <p className={styles.tongue_text_block}>
          {tongueData.textToRead}
        </p>
      </div>

      {/* Футер с кнопкой запуска записи */}
      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!tongueData}
        >
          Приступить
        </button>
      </div>
    </div>
  )
}

export default PoemTongueIdle
