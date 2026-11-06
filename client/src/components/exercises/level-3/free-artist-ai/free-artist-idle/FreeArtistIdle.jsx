import React from 'react'
import { Icon20InfoCircleOutline } from '@vkontakte/icons'

import styles from './FreeArtistIdle.module.css'

const PRESETS = [
  'Презентация ИИ-стартапа перед инвесторами',
  'Защита дипломной работы на кафедре',
  'Самопрезентация на собеседовании',
  'Убедительный спич на рабочей летучке',
  'Торжественная речь на юбилее друга'
]

const FreeArtistIdle = ({
  customTopic,
  setCustomTopic,
  onShowTheory,
  onStart,
}) => {
  return (
    <div className={styles.screen_idle}>
      <button className={styles.btn_theory} onClick={onShowTheory}>
        <Icon20InfoCircleOutline className={styles.theory_icon} />
        Изучить основы монолога
      </button>

      <div className={styles.idle_box}>
        <label className={styles.input_label}>Тема вашего выступления:</label>
        <textarea
          className={styles.topic_input}
          placeholder="Введите тему, презентацию или тост, который хотите отрепетировать..."
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          maxLength={150}
        />
        
        <div className={styles.presets_container}>
          <span className={styles.presets_title}>Быстрые шаблоны:</span>
          <div className={styles.presets_list}>
            {PRESETS.map((preset, index) => (
              <button
                key={index}
                className={styles.preset_badge}
                onClick={() => setCustomTopic(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.idle_footer}>
        <button
          className={styles.btn_start}
          onClick={onStart}
          disabled={!customTopic.trim()}
        >
          Взять микрофон
        </button>
      </div>
    </div>
  )
}

export default FreeArtistIdle
