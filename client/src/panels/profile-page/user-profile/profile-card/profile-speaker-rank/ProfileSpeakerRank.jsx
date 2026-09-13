import React from 'react'
import styles from './ProfileSpeakerRank.module.css'

// Полный список рангов для визуализации карты прогресса
const ALL_STAGES = [
  { xpThreshold: 0, title: 'Начинающий', mic: '🎙️' },
  { xpThreshold: 10000, title: 'Уверенный', mic: '🎤' },
  { xpThreshold: 50000, title: 'Профи', mic: '🎧' },
  { xpThreshold: 200000, title: 'Мастер', mic: '📻' },
  { xpThreshold: 500000, title: 'Легенда', mic: '👑' }
]

const ProfileSpeakerRank = ({ userXp, progressData }) => {
  return (
    <div className={styles.mic_progress_block}>
      
      {/* Шапка текущего ранга */}
      <div className={styles.mic_header}>
        <div className={styles.mic_icon_box}>
          <span className={styles.dynamic_mic}>{progressData.mic}</span>
        </div>
        <div className={styles.mic_titles}>
          <span className={styles.rank_title}>Ваш текущий ранг: {progressData.title}</span>
          <h5 className={styles.audience_text}>{progressData.audience}</h5>
        </div>
      </div>
      
      <p className={styles.stage_desc}>{progressData.desc}</p>
      
      {/* Шкала XP */}
      <div className={styles.xp_wrapper}>
        <div className={styles.xp_labels}>
          <span>{userXp} XP</span>
          <span>{progressData.maxXp === Infinity ? 'MAX' : `${progressData.maxXp} XP`}</span>
        </div>
        <div className={styles.xp_track}>
          <div 
            className={styles.xp_fill} 
            style={{ width: `${progressData.percent}%` }}
          />
        </div>
      </div>

      {/* КАРТА МОТИВАЦИИ: Список всех рангов приложения */}
      <div className={styles.timeline_container}>
        <h6 className={styles.timeline_title}>Карта ораторского пути:</h6>
        <div className={styles.stages_line}>
          {ALL_STAGES.map((stage, index) => {
            // Проверяем, достиг ли пользователь этого ранга
            const isReached = userXp >= stage.xpThreshold
            // Проверяем, является ли ранг текущим активным
            const isCurrent = progressData.title === stage.title

            return (
              <div 
                key={index} 
                className={`${styles.stage_node} ${isReached ? styles.node_reached : ''} ${isCurrent ? styles.node_current : ''}`}
              >
                <div className={styles.node_mic_box}>
                  {stage.mic}
                </div>
                <span className={styles.node_title}>{stage.title}</span>
                <span className={styles.node_xp_hint}>
                  {stage.xpThreshold === 0 ? '0' : `${stage.xpThreshold}+`} XP
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

export default ProfileSpeakerRank
