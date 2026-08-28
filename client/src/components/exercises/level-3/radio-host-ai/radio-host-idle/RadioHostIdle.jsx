import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './RadioHostIdle.module.css' // Стили полностью синхронизированы с базовым дизайном

const RadioHostIdle = ({
  onRefreshTopic,
  onShowTheory,
  radioData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка ознакомления с теорией */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      {/* Название эфирного шоу с кнопкой обновления карточки новостей */}
      <span className={styles.screen_idle_title}>
        Шоу: {radioData.topic}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Обертка карточки (центрирование, max-width и полупрозрачный синий фон) */}
      <div className={styles.idle_box}>
        <div className={styles.focus_sounds_container}>
          <span className={styles.focus_label}>
            Формат: Эфирный перерыв
          </span>
          <div className={styles.badges_list}>
            <span className={styles.sound_badge}>Импровизация</span>
            <span className={styles.sound_badge}>Без пауз</span>
          </div>
        </div>

        {/* Сетка задач для прямого эфира */}
        <div className={styles.radio_task_container}>
          <div className={styles.radio_task_item}>
            <span className={styles.radio_task_label}>
              ☀️ 1. Сводка погоды:
            </span>
            <p className={styles.radio_task_text}>
              {radioData.weather}
            </p>
          </div>

          <div className={styles.radio_task_item}>
            <span className={styles.radio_task_label}>
              💡 2. Интересный факт:
            </span>
            <p className={styles.radio_task_text}>
              {radioData.funnyFact}
            </p>
          </div>

          <div className={styles.radio_task_item}>
            <span className={styles.radio_task_label}>
              🎵 3. Подводка к треку:
            </span>
            <p className={styles.radio_task_text}>
              В финале плавно перейдите на:{' '}
              <span className={styles.song_highlight}>
                «{radioData.songTransition}»
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Футер с кнопкой запуска записи */}
      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!radioData}
        >
          Выйти в прямой эфир
        </button>
      </div>
    </div>
  )
}

export default RadioHostIdle
