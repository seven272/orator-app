import React from 'react'
import styles from './AiWorkoutResult.module.css'

const AiWorkoutResult = ({ evaluationResult, config, onBack }) => {
  // Вытаскиваем флаг из ответа бэкенда
  const isScoreCounted = evaluationResult.isScoreCounted

  return (
    <div className={styles.result_card}>
      <h3 className={styles.result_title}>🎯 Итоги встречи</h3>

      {/* ✅ ДИНАМИЧЕСКИЙ БЛОК СТАТУСА НАЧИСЛЕНИЯ БАЛЛОВ */}
      {isScoreCounted !== undefined && (
        <div
          className={`${styles.status_banner} ${
            isScoreCounted
              ? styles.banner_success
              : styles.banner_warning
          }`}
        >
          <span className={styles.banner_icon}>
            {isScoreCounted ? '🟢' : '⚠️'}
          </span>
          <div className={styles.banner_text}>
            <strong>
              {isScoreCounted
                ? 'Попытка засчитана!'
                : 'Попытка не засчитана'}
            </strong>
            <p>
              {isScoreCounted
                ? 'Баллы успешно добавлены в общую копилку этого блока.'
                : 'Для прохождения блока нужно набирать от 65 баллов за сессию.'}
            </p>
          </div>
        </div>
      )}

      <div className={styles.metrics_row}>
        {/* Главный итоговый балл */}
        <div className={styles.metric_item}>
          <div className={styles.score_main}>
            {evaluationResult.totalScore}
          </div>
          <div className={styles.metric_label}>Общий балл</div>
        </div>

        {/* ДИНАМИЧЕСКИЙ РЕНДЕРИНГ ШКАЛ НА ОСНОВЕ КОНФИГА */}
        {config.criteria.map((criterion) => {
          const score =
            evaluationResult.criteria?.[criterion.key] || 0
          return (
            <div key={criterion.key} className={styles.metric_item}>
              <div className={styles.score_sub}>{score}/100</div>
              <div className={styles.metric_label}>
                {criterion.label}
              </div>
            </div>
          )
        })}
      </div>

      <p className={styles.feedback_box}>
        <strong>Разбор ментора:</strong> {evaluationResult.feedback}
      </p>

      <button className={styles.back_button} onClick={onBack}>
        Вернуться к тренажерам
      </button>
    </div>
  )
}

export default AiWorkoutResult
