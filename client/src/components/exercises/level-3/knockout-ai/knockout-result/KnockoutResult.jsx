import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './KnockoutResult.module.css'

// Словарь критериев адаптирован под комедийный импровизационный Stand-Up баттл
const dictionary = {
  reaction: 'Скорость реакции',
  humor: 'Юмор и панчи',
  irony: 'Самоирония',
}

const KnockoutResult = ({ onCloseExercise, onRestartExercise }) => {
  const { verdict } = useSelector((state) => state.knockout)

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Выступление завершено</h3>

        {/* Общий балл комедийного баттла */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация комедийных критериев */}
        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span>
                {dictionary[name] || name}: {value}
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Текстовый фидбек от продюсеров */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Резюме комедийного продюсера:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Кнопки управления */}
        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Выйти на сцену снова
          </button>
          <button
            className={styles.btn_close}
            onClick={onCloseExercise}
          >
            Покинуть клуб
          </button>

          <button
            className={styles.btn_share}
            onClick={() => console.log('vk share')}
          >
            <IoMdShare size={15} /> Поделиться панчем
          </button>
        </div>
      </div>
    </div>
  )
}

export default KnockoutResult
