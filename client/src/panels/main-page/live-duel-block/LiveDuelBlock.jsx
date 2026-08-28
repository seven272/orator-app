import React from 'react'

import styles from './LiveDuelBlock.module.css'

const LiveDuelBlock = () => {
  return (
  <section className={styles.duelSection}>
  <h2 className={styles.sectionTitle}>⚔️ ЖИВЫЕ ДУЭЛИ</h2>
  
  <div className={styles.duelCard}>
    <p className={styles.duelDescription}>
      Случайный оппонент, острая тема для дискуссии и по 2 минуты на защиту своей позиции по видеосвязи.
    </p>
    
    <button className={styles.startDuelBtn}>
      {/* Иконка видеокамеры */}
      <svg 
        xmlns="http://w3.org" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        className={styles.videoIcon}
      >
        <path d="M4.5 4.5A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 14.5 4.5H4.5X" />
        <path d="M18.4 6.72a.75.75 0 0 1 .37.64v9.28a.75.75 0 0 1-1.18.61l-2.09-1.57a.75.75 0 0 1-.3-.6V9.16a.75.75 0 0 1 .3-.6l2.09-1.57a.75.75 0 0 1 .81-.07Z" />
      </svg>
      Начать дуэль
    </button>
  </div>
</section>
  )
}

export default LiveDuelBlock