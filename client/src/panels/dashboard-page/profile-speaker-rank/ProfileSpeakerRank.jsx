/* eslint-disable react/prop-types */
import React from 'react'
import styles from './ProfileSpeakerRank.module.css'

const ALL_STAGES = [
  { xpThreshold: 0, title: 'Начинающий', mic: '🎙️' },
  { xpThreshold: 10000, title: 'Уверенный', mic: '🎤' },
  { xpThreshold: 50000, title: 'Профи', mic: '🎧' },
  { xpThreshold: 200000, title: 'Мастер', mic: '📻' },
  { xpThreshold: 500000, title: 'Легенда', mic: '👑' },
]

  const calculateRoadPercent = (userXp) => {
    // 1. Крайний случай: если опыт равен или превышает максимум (Легенда)
    const maxThreshold = ALL_STAGES[ALL_STAGES.length - 1].xpThreshold
    if (userXp >= maxThreshold) return 100

    // 2. Находим текущий интервал, в котором находится пользователь
    let currentStageIndex = 0
    for (let i = 0; i < ALL_STAGES.length - 1; i++) {
      if (
        userXp >= ALL_STAGES[i].xpThreshold &&
        userXp < ALL_STAGES[i + 1].xpThreshold
      ) {
        currentStageIndex = i
        break
      }
    }

    // 3. Берем пороговые значения текущего отрезка пути
    const startXp = ALL_STAGES[currentStageIndex].xpThreshold
    const endXp = ALL_STAGES[currentStageIndex + 1].xpThreshold

    // 4. Считаем, какой процент отрезка пользователь уже прошел
    const xpInInterval = userXp - startXp
    const intervalTotalXp = endXp - startXp
    const percentInInterval = (xpInInterval / intervalTotalXp) * 100

    // 5. Распределяем визуальный вес: каждая из 4-х секций занимает ровно 25% общей линии
    const segmentWeight = 25
    const totalRoadPercent =
      currentStageIndex * segmentWeight +
      percentInInterval * (segmentWeight / 100)

    return Math.min(Math.max(totalRoadPercent, 0), 100)
  }

const ProfileSpeakerRank = ({ userXp, progressData }) => {


  // Вычисляем общий процент прохождения всей карты ораторского пути для закрашивания линии
  // 500 000 XP — это наш абсолютный максимум (Легенда)
  const totalRoadPercent = calculateRoadPercent(userXp)

  return (
    <div className={styles.mic_progress_block}>
      {/* Крупная статусная шапка */}
      <div className={styles.mic_header}>
        <div className={styles.mic_icon_box}>
          <span className={styles.dynamic_mic}>
            {progressData.mic}
          </span>
        </div>
        <div className={styles.mic_titles}>
          <span className={styles.rank_title}>Ваш текущий ранг</span>
          <h5 className={styles.audience_text}>
            {progressData.title}
          </h5>
        </div>
      </div>

      <p className={styles.stage_desc}>{progressData.desc}</p>

      {/* Текущая шкала XP уровня */}
      <div className={styles.xp_wrapper}>
        <div className={styles.xp_labels}>
          <span className={styles.xp_current_text}>{userXp} XP</span>
          <span>
            {progressData.maxXp === Infinity
              ? 'MAX'
              : `${progressData.maxXp} XP`}
          </span>
        </div>
        <div className={styles.xp_track}>
          <div
            className={styles.xp_fill}
            style={{ width: `${progressData.percent}%` }}
          />
        </div>
        <span className={styles.audience_sub_hint}>
          🔥 {progressData.audience}
        </span>
      </div>

      {/* КАРТА ОРАТОРСКОГО ПУТИ (Премиальный интерактивный таймлайн) */}
      <div className={styles.timeline_container}>
        <h6 className={styles.timeline_title}>
          Карта ораторского пути
        </h6>

        <div className={styles.timeline_wrapper_scroll}>
          <div className={styles.stages_line}>
            {/* 🔒 ЖЕСТКАЯ СКВОЗНАЯ РЕЛЬСА ПРОГРЕССА */}
            <div className={styles.progress_line_track}>
              <div
                className={styles.progress_line_fill}
                style={{ width: `${totalRoadPercent}%` }}
              />
            </div>

            {ALL_STAGES.map((stage, index) => {
              const isReached = userXp >= stage.xpThreshold
              const isCurrent = progressData.title === stage.title

              return (
                <div
                  key={index}
                  className={`${styles.stage_node} ${isReached ? styles.node_reached : ''} ${isCurrent ? styles.node_current : ''}`}
                >
                  <div className={styles.node_mic_box}>
                    <span className={styles.node_emoji}>
                      {stage.mic}
                    </span>
                  </div>
                  <span className={styles.node_title}>
                    {stage.title}
                  </span>
                  <span className={styles.node_xp_hint}>
                    {stage.xpThreshold === 0
                      ? '0 XP'
                      : `${stage.xpThreshold / 1000}к+ XP`}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSpeakerRank
