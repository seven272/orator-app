import React from 'react'

import { THEORY_DATA } from '../../assets/mocks/theoryData'
import styles from './TheoryContent.module.css'

const TheoryContent = ({ alias, onClose }) => {
  const content = THEORY_DATA[alias]

  if (!content) {
    return (
     <div className={styles.container}>
        <p className={styles.text}>Информация для этого упражнения скоро появится.</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{content.title}</h2>

      <section className={styles.section}>
        <span className={styles.label}>Теория:</span>
        <p className={styles.text_secondary}>{content.theory}</p>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Что развивает:</span>
        <p className={styles.text}>{content.skill}</p>
      </section>

      <section className={styles.section}>
        <span className={styles.label}>Как прокачивать:</span>
        <p className={styles.text}>{content.howTo}</p>
      </section>

      <div className={styles.example_box}>
        <span className={styles.label}>Пример выполнения:</span>
        <p className={styles.example_text}>{content.example}</p>
      </div>

      <button className={styles.close_button} onClick={onClose}>
        Понятно
      </button>
    </div>
  )
}

export default TheoryContent
