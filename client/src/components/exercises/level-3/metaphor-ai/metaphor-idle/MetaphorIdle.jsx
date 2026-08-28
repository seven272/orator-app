import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './MetaphorIdle.module.css'

const MetaphorIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка перехода к комедийно-интеллектуальной теории */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить приемы объяснения
      </button>
      
      <span className={styles.screen_idle_title}>
        Сменить термин / роль{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>
      
      {/* Информационный блок сценария "Трудный переводчик" */}
      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Персонаж:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Термин для перевода:</strong> {situationData.term}
        </span>
        <span className={styles.idle_text}>
          <strong>Кто перед вами:</strong> {situationData.target_audience}
        </span>
        <span className={styles.idle_text}>
          <strong>Жесткое ограничение:</strong> {situationData.constraint}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Начать объяснение
        </button>
      </div>
    </div>
  )
}

export default MetaphorIdle
