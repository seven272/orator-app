import React, { useState } from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'
import { GrUpdate } from 'react-icons/gr'
import styles from './HistoricalIdle.module.css'

const HistoricalIdle = ({ onRefreshTopic, onShowTheory, scenarioData, onStart }) => {
  const [activeTab, setActiveTab] = useState('task') // 'task' или 'master'

  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Ознакомиться с теорией риторики
      </button>

      <span className={styles.screen_idle_title}>
        {scenarioData.topic}
        <GrUpdate size={15} className={styles.change_topic_icon} onClick={onRefreshTopic} />
      </span>

      {/* Интерактивные табы для глубокого ознакомления перед речью */}
      <div className={styles.tab_container}>
        <button 
          className={`${styles.tab_btn} ${activeTab === 'task' ? styles.tab_active : ''}`}
          onClick={() => setActiveTab('task')}
        >
          🎯 Твое задание
        </button>
        <button 
          className={`${styles.tab_btn} ${activeTab === 'master' ? styles.tab_active : ''}`}
          onClick={() => setActiveTab('master')}
        >
          🏛️ Стиль мастера: {scenarioData.orator}
        </button>
      </div>

      <div className={styles.idle_box}>
        {activeTab === 'task' ? (
          <>
            <p className={styles.context_badge}>Бытовая ситуация:</p>
            <span className={styles.idle_text_context}>{scenarioData.context}</span>
            <p className={styles.task_badge}>Что нужно сделать:</p>
            <span className={styles.idle_text_task}>{scenarioData.task}</span>
          </>
        ) : (
          <>
            <p className={styles.master_badge}>Исторический прототип: {scenarioData.orator}</p>
            <span className={styles.idle_text_master}>
              Этот тренажер основан на великих выступлениях, которые изменили мир. Твоя задача — перенять скелет и дух оригинальной речи. 
              Обрати внимание на ключевые приемы, которые ожидает услышать ИИ-судья.
            </span>
            <p className={styles.hints_badge}>Рекомендуемые приемы и подсказки:</p>
            <div className={styles.hints_list}>
              {scenarioData.hints.map((hint, idx) => (
                <span key={idx} className={styles.hint_item}>• {hint}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.idle_footer}>
        <button className={styles.btn_start} onClick={onStart} disabled={!scenarioData}>
          Приступить к батлу
        </button>
      </div>
    </div>
  )
}

export default HistoricalIdle
