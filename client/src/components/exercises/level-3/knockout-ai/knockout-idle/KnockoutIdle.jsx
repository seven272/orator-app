import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './KnockoutIdle.module.css'

const KnockoutIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      {/* Кнопка перехода к комедийной теории */}
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить приемы стендапа
      </button>

      <span className={styles.screen_idle_title}>
        Сменить клуб / тему{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      {/* Информационный блок комедийного сценария */}
      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Площадка:</strong> {situationData.situation}
        </span>
        <span className={styles.idle_text}>
          <strong>Атмосфера в зале:</strong> {situationData.context}
        </span>
        <span className={styles.idle_text}>
          <strong>Цель хеклера (ИИ):</strong> Будет жестко высмеивать:{' '}
          {situationData.heckler_focus}
        </span>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Выйти на сцену
        </button>
      </div>
    </div>
  )
}

export default KnockoutIdle
