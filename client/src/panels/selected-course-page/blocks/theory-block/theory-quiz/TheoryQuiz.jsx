import { useState } from 'react'

import styles from './TheoryQuiz.module.css'

const TheoryQuiz = ({ quizData, isSubmitting, onPrev, onSubmit}) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null)

   const handleLocalSubmit = () => {
    if (selectedAnswer !== null) {
      onSubmit(selectedAnswer) // Передаем индекс в родительский handleSubmit
    }
  }
  return (
    <div className={styles.card_content}>
      <span className={styles.badge_quiz}>Контрольный вопрос</span>
      <h3 className={styles.quiz_question}>{quizData.question}</h3>

      <div className={styles.options_list}>
        {quizData.options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option_card} ${selectedAnswer === index ? styles.option_selected : ''}`}
            onClick={() => setSelectedAnswer(index)}
            disabled={isSubmitting}
          >
            <div className={styles.option_radio}>
              {selectedAnswer === index && (
                <div className={styles.radio_dot} />
              )}
            </div>
            <span className={styles.option_text}>{option}</span>
          </button>
        ))}
      </div>

      <div className={styles.navigation_zone}>
        <button
          className={styles.nav_button_secondary}
          onClick={onPrev}
          disabled={isSubmitting}
        >
          К теории
        </button>
        <button
          className={styles.submit_button}
          onClick={handleLocalSubmit}
          disabled={selectedAnswer === null || isSubmitting}
        >
          {isSubmitting ? 'Проверка...' : 'Проверить ответ'}
        </button>
      </div>
    </div>
  )
}

export default TheoryQuiz
