import React from 'react'
import styles from './ChallengeInstructions.module.css'

const ChallengeInstructions = ({ data }) => {
  return (
    <div className={styles.instructions_card}>
      <span className={styles.badge_irl}>Практический челлендж</span>
      <h2 className={styles.title}>{data.title}</h2>
      {/* Сохраняем переносы строк из текста */}
      <p className={styles.text_content}>{data.instructions}</p>
    </div>
  )
}

export default ChallengeInstructions
