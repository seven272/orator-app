import React from 'react'
import {
  IoMdArrowRoundBack,
  IoMdArrowRoundForward,
} from 'react-icons/io'
import styles from './ExerciseControls.module.css'

// Константы лучше вынести в отдельный файл или передавать пропсом,
// но для простоты оставим здесь
const SCORING_DATA = {
  LEVEL_1: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 15 },
    { label: 'Уверенно', value: 30 },
  ],
  LEVEL_2: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 25 },
    { label: 'Уверенно', value: 50 },
  ],
}

const ExerciseControls = ({
  status,
  level = 'LEVEL_2',
  STATUS, // Объект со статусами
  xp,
  isTaskInterrupted,
  onStart,
  onStop,
  onRate,
  onFinish,
  onNext,
}) => {
  return (
    <div className={styles.btns_wrap}>
      {/* Кнопка Старт */}
      {status === STATUS.IDLE && (
        <button className={styles.btn_start} onClick={onStart}>
          Начать задание
        </button>
      )}

      {/* Кнопка Остановить */}
      {status === STATUS.RUNNING && (
        <button className={styles.btn_stop} onClick={onStop}>
          Остановить
        </button>
      )}

      {/* Блок оценки */}
      {status === STATUS.FINISHED &&
        xp === 0 &&
        !isTaskInterrupted && (
          <div className={styles.btns_finished_wrap}>
            {SCORING_DATA[`${level}`].map((option) => (
              <button
                key={option.value}
                onClick={() => onRate(option.value)}
                className={styles.btn_rate}
              >
                <span>{option.label}</span>
                <span>{option.value}xp</span>
              </button>
            ))}
          </div>
        )}

      {/* Кнопки Навигации (Закончить / Продолжить) */}
      {status === STATUS.FINISHED &&
        (xp !== 0 || isTaskInterrupted) && (
          <div className={styles.btns_finished_wrap}>
            <button className={styles.btn_end} onClick={onFinish}>
              <IoMdArrowRoundBack size={18} />
              Закончить
            </button>
            <button className={styles.btn_next} onClick={onNext}>
              Продолжить
              <IoMdArrowRoundForward size={18} />
            </button>
          </div>
        )}
    </div>
  )
}

export default ExerciseControls
