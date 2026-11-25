import styles from './RankExamIdle.module.css'

const RankExamIdle = ({
  timeLimit,
  isLoading,
  error,
  onStartExam,
  onBack,
}) => {
  return (
    <div className={styles.screen_idle}>
      <span className={styles.badge}>АТТЕСТАЦИЯ РАНГА</span>
      <h3 className={styles.idle_title}>Правила экзамена</h3>

      <div className={styles.rules_box}>
        <div className={styles.rule_item}>
          <span className={styles.rule_icon}>🎫</span>
          <span>
            После старта система вытянет <strong>случайный билет</strong> с
            темой и условиями.
          </span>
        </div>

        <div className={styles.rule_item}>
          <span className={styles.rule_icon}>⏱️</span>
          <span>
            На выступление дается <strong>{timeLimit} секунд</strong> в формате
            одного цельного монолога.
          </span>
        </div>

        <div className={styles.rule_item}>
          <span className={styles.rule_icon}>⚖️</span>
          <span>
            Для зачета необходимо набрать{' '}
            <strong>строго больше 80 баллов</strong> от ИИ-судьи.
          </span>
        </div>

        <div className={styles.rule_item}>
          <span className={styles.rule_icon}>🔄</span>
          <span>
            Опыт и монеты за экзамен не начисляются. При неудаче можно
            пересдать с новым билетом.
          </span>
        </div>
      </div>

      {error && (
        <div className={styles.locked_box}>
          <span className={styles.locked_title}>🔒 Доступ ограничен</span>
          <p className={styles.locked_text}>{error}</p>
          <button
            type="button"
            className={styles.btn_back_profile}
            onClick={onBack}
          >
            Вернуться к условиям ранга
          </button>
        </div>
      )}

      {!error && (
        <div className={styles.idle_footer}>
          <button
            type="button"
            className={styles.btn_start}
            onClick={onStartExam}
            disabled={isLoading}
          >
            {isLoading ? 'Готовим билет...' : 'Тянуть билет'}
          </button>
          <button
            type="button"
            className={styles.btn_cancel}
            onClick={onBack}
            disabled={isLoading}
          >
            Назад в профиль
          </button>
        </div>
      )}
    </div>
  )
}

export default RankExamIdle
