import React from 'react'
import styles from './Progressbar.module.css'

const Progressbar = ({ completed }) => {
  const fillerWidth = {
    width: `${completed}%`,
  }

  return (
    <div className={styles.progressbar}>
      <span className={styles.title}>План выполнен на:</span>
      <div className={styles.container}>
        <div className={styles.filler} style={fillerWidth}>
          <span className={styles.label}>{`${completed}%`}</span>
        </div>
      </div>
    </div>
  )
}

export default Progressbar
