import { useSelector } from 'react-redux'
import Spinner from '../../../UI/spinner/Spinner'
import styles from './RankExamResult.module.css'

const FALLBACK_LABELS = {
  structure: 'Структура питча',
  clarity: 'Ясность и чистота речи',
  cta: 'Призыв к действию',
  arguments: 'Сила аргументов',
  counterargument: 'Закрытие возражения',
  confidence: 'Уверенность позиции',
  empathy: 'Эмпатия и честность',
  reframing: 'План действий и рефрейминг',
  triggers: 'Вплетение обязательных вводных',
  storytelling: 'Хук и сторителлинг',
  metaphor: 'Раскрытие метафоры',
  manifesto: 'Масштаб вывода и финал',
}

const RankExamResult = ({ onBackToProfile, onRetakeExam }) => {
  const { verdict, passed, minScore, examMeta } = useSelector(
    (state) => state.rankExam,
  )

  if (!verdict) return <Spinner centered={true} />

  const labelsMap = examMeta?.criteriaLabels || FALLBACK_LABELS
  const criteriaEntries = verdict.criteria
    ? Object.entries(verdict.criteria)
    : []

  return (
    <div className={styles.screen_finished}>
      <div className={styles.finish_card}>
        <div
          className={`${styles.status_badge} ${passed ? styles.badge_passed : styles.badge_failed}`}
        >
          {passed
            ? '🎉 ЭКЗАМЕН СДАН!'
            : `❌ НЕ СДАНО (НУЖНО > ${minScore} БАЛЛОВ)`}
        </div>

        <h3 className={styles.finish_title}>
          {passed
            ? 'Поздравляем! Испытание пройдено'
            : 'Попробуйте еще раз с новым билетом'}
        </h3>

        {/* Общий балл в круге */}
        <div
          className={`${styles.score_circle} ${passed ? styles.circle_passed : styles.circle_failed}`}
        >
          <span className={styles.score_value}>{verdict.totalScore}</span>
          <span className={styles.score_label}>из 100</span>
        </div>

        {/* Детализация оценок по критериям */}
        {criteriaEntries.length > 0 && (
          <div className={styles.criteria_list}>
            {criteriaEntries.map(([key, value]) => (
              <div key={key} className={styles.criteria_item}>
                <div className={styles.criteria_header}>
                  <span>{labelsMap[key] || key}</span>
                  <strong>{value} / 100</strong>
                </div>
                <div className={styles.mini_bar}>
                  <div
                    className={
                      passed ? styles.bar_passed : styles.bar_failed
                    }
                    style={{ width: `${Math.min(Number(value) || 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Текстовый вердикт ИИ-судьи */}
        <div className={styles.verdict_box}>
          <h4 className={styles.verdict_subtitle}>Вердикт ИИ-судьи:</h4>
          <p className={styles.verdict_text}>{verdict.feedback}</p>
        </div>

        <div className={styles.btn_group}>
          {passed ? (
            <button
              type="button"
              className={styles.btn_primary}
              onClick={onBackToProfile}
            >
              Вернуться в профиль и забрать ранг
            </button>
          ) : (
            <>
              <button
                type="button"
                className={styles.btn_primary}
                onClick={onRetakeExam}
              >
                Пересдать (новый билет)
              </button>
              <button
                type="button"
                className={styles.btn_secondary}
                onClick={onBackToProfile}
              >
                Вернуться в профиль
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RankExamResult
