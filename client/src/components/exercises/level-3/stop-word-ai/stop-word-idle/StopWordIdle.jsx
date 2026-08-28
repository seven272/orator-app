import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './StopWordIdle.module.css'

const StopWordIdle = ({
  onRefreshTopic,
  onShowTheory,
  scenarioData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка ознакомления с теорией */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией
      </button>

      {/* Заголовок с названием темы и иконкой обновления */}
      <span className={styles.screen_idle_title}>
        {scenarioData.topic}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Обертка карточки (центрирование по вашему Правилу №4) */}
      <div className={styles.idle_box}>
        {/* Текст основного задания */}
        <p className={styles.tongue_text_block}>
          {scenarioData.task}
        </p>

        {/* Блок со списками жестких ограничений */}
        <div className={styles.taboo_container}>
          
          {/* Группа 1: Слова-паразиты */}
          <div className={styles.taboo_section}>
            <span className={styles.focus_label}>🛑 Запрещенные паразиты:</span>
            <div className={styles.badges_list}>
              {scenarioData.tabooParasites.map((word, index) => (
                <span key={index} className={styles.parasite_badge}>
                  {word}
                </span>
              ))}
            </div>
          </div>

          {/* Группа 2: Тематические стоп-слова */}
          <div className={styles.taboo_section}>
            <span className={styles.focus_label}>❌ Тематические стоп-слова:</span>
            <div className={styles.badges_list}>
              {scenarioData.tabooThemeWords.map((word, index) => (
                <span key={index} className={styles.theme_badge}>
                  {word}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Футер с кнопкой запуска */}
      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!scenarioData}
        >
          Приступить
        </button>
      </div>
    </div>
  )
}

export default StopWordIdle
