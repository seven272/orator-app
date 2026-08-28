import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './PoemActingIdle.module.css'

const PoemActingIdle = ({
  onRefreshTopic,
  onShowTheory,
  actingData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка ознакомления с теорией */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      {/* Заголовок с темой сценария и иконкой обновления */}
      <span className={styles.screen_idle_title}>
        {actingData.topic}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Центральный блок контента по Правилу №4 (display: block, text-align: center) */}
      <div className={styles.idle_box}>
        {/* Бейдж заданной актерской роли */}
        <div className={styles.role_badge_container}>
          <span className={styles.idle_subtitle}>Ваша роль:</span>
          <span className={styles.role_badge}>
            {actingData.actingRole}
          </span>
        </div>

        {/* Текстовые инструкции по отыгрышу */}
        <p className={styles.idle_text}>{actingData.instructions}</p>

        {/* Текст стихотворения, который нужно будет прочитать */}
        <p className={styles.poem_preview_text}>
          «{actingData.poemText}»
        </p>
      </div>

      {/* Футер с кнопкой запуска тренажера */}
      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!actingData}
        >
          Приступить
        </button>
      </div>
    </div>
  )
}

export default PoemActingIdle
