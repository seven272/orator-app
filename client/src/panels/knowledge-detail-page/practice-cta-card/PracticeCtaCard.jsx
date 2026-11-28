import React from 'react'
import { TbMicrophone2, TbPlayerPlay } from 'react-icons/tb'

import styles from './PracticeCtaCard.module.css'

const PracticeCtaCard = ({ exerciseAlias, onStartExercise }) => {
  if (!exerciseAlias) {
    return null
  }

  return (
    <section className={styles.practice_cta_card}>
      <div className={styles.cta_icon_box}>
        <TbMicrophone2 size={26} />
      </div>

      <div className={styles.cta_text_block}>
        <h3 className={styles.cta_title}>Закрепите навык на практике</h3>
        <p className={styles.cta_desc}>
          Теория работает только в действии. Отработайте прием в живом
          спарринге с ИИ-тренером.
        </p>
      </div>

      <button
        type="button"
        className={styles.cta_action_btn}
        onClick={() => onStartExercise(exerciseAlias)}
      >
        <TbPlayerPlay size={18} />
        <span>Перейти в тренажер</span>
      </button>
    </section>
  )
}

export default PracticeCtaCard
