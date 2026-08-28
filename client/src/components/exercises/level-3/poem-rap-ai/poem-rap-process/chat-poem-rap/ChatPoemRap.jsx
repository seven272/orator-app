import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatPoemRap.module.css' // Изолированные стили чата
import { AI_STATUS } from '../../../../../../constants/exercises'

const ChatPoemRap = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  // Плавная автопрокрутка к последней реплике или статусу
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  // Кастомные музыкальные статусы ИИ-продюсера для рэп-тренажера
  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return (
          <span className={styles.status_fade}>
            Бит на паузе. Жду твоего флоу...
          </span>
        )
      case AI_STATUS.RECORDING:
        return (
          <span className={styles.status_active}>
            Запись пошла! Качай этот микрофон...
          </span>
        )
      case AI_STATUS.PROCESSING:
        return (
          <span className={styles.status_loading}>
            Оцифровую аудиодорожку...
          </span>
        )
      case AI_STATUS.AI_THINKING:
        return (
          <div className={styles.typing_dots_small}>
            Проверяю попадание в такт...
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.chat_container}>
      {/* Список реплик и расшифровок из истории */}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.bubble} ${styles[msg.role]}`}
        >
          {msg.text}
        </div>
      ))}

      {/* Постоянный интерактивный блок ИИ-продюсера */}
      {aiStatus !== AI_STATUS.FINISHED && (
        <div className={styles.ai_wrapper}>
          <div className={styles.ai_avatar_wrapper}>
            <RiRobot2Fill className={styles.ai_icon} />
            {(aiStatus === AI_STATUS.RECORDING ||
              aiStatus === AI_STATUS.AI_THINKING) && (
              <div className={styles.pulse_dot} />
            )}
          </div>

          <div
            className={`${styles.bubble} ${styles.ai} ${styles.status_bubble}`}
          >
            {renderAiStatusText()}
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatPoemRap
