import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'

import styles from './AssociationMasterIdle.module.css'

const AssociationMasterIdle = ({
  onRefreshTopic,
  onShowTheory,
  situationData,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить теорию мостов
      </button>

      <span className={styles.screen_idle_title}>
        Сменить понятия{' '}
        <GrUpdate
          size={15}
          className={styles.change_topic_icon}
          onClick={onRefreshTopic}
        />
      </span>

      <div className={styles.idle_box}>
        <span className={styles.idle_text}>
          <strong>Парадокс:</strong> {situationData.situation}
        </span>
        
        <div className={styles.concepts_wrapper}>
          <div className={styles.concept_item}>
            <span className={styles.concept_label}>Понятие А</span>
            <span className={styles.concept_name}>{situationData.concept_A}</span>
          </div>
          <div className={styles.concepts_divider}>➔</div>
          <div className={styles.concept_item}>
            <span className={styles.concept_label}>Понятие Б</span>
            <span className={styles.concept_name}>{situationData.concept_B}</span>
          </div>
        </div>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!situationData}
        >
          Построить мост
        </button>
      </div>
    </div>
  )
}

export default AssociationMasterIdle
