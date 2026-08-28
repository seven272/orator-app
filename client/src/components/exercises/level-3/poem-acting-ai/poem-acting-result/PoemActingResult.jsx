import React from 'react'
import { IoMdShare } from 'react-icons/io'
import { useSelector } from 'react-redux'
import { ScreenSpinner } from '@vkontakte/vkui'

import styles from './PoemActingResult.module.css'

// Специализированный словарь локализации для критериев актерского мастерства
const dictionary = {
  characterMatch: 'Попадание в образ',
  intonation: 'Интонационная гибкость',
  creativity: 'Оригинальность',
}

const PoemActingResult = ({ onCloseExercise, onRestartExercise }) => {
  // Достаем итоговый вердикт из слайса мастера дубляжа
  const { verdict } = useSelector((state) => state.poemActing)

  if (!verdict) return <ScreenSpinner />

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <h3 className={styles.finish_title}>Упражнение завершено</h3>

        {/* Общий балл в круге */}
        <div className={styles.score_circle}>
          <span className={styles.score_value}>
            {verdict.totalScore}
          </span>
          <span className={styles.score_label}>баллов</span>
        </div>

        {/* Детализация оценок по актерской игре */}
        <div className={styles.criteria_list}>
          {Object.entries(verdict.criteria).map(([name, value]) => (
            <div key={name} className={styles.criteria_item}>
              <span>
                {dictionary[name] || name}: {value}%
              </span>
              <div className={styles.mini_bar}>
                <div style={{ width: `${value}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Режиссерский разбор ИИ */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>
            Разбор ИИ-Режиссера:
          </h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        {/* Группа кнопок управления сессией */}
        <div className={styles.btn_group}>
          <button
            className={styles.btn_restart}
            onClick={onRestartExercise}
          >
            Начать заново
          </button>
          <button
            className={styles.btn_close}
            onClick={onCloseExercise}
          >
            Завершить упражнение
          </button>

          <button
            className={styles.btn_share}
            onClick={() => console.log('vk share')}
          >
            <IoMdShare size={15} /> Поделиться результатом
          </button>
        </div>
      </div>
    </div>
  )
}

export default PoemActingResult
