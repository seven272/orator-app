import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatEmpathySpark.module.css'
import { AI_STATUS } from '../../../../../../constants/exercises'

const ChatEmpathySpark = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  // Автопрокрутка чата при получении новых реплик
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return (
          <span className={styles.status_fade}>
            Человек ждет твоего ответа...
          </span>
        )
      case AI_STATUS.RECORDING:
        return (
          <span className={styles.status_active}>
            Слушает твои слова поддержки...
          </span>
        )
      case AI_STATUS.PROCESSING:
        return (
          <span className={styles.status_loading}>
            Анализирует твой тон...
          </span>
        )
      case AI_STATUS.AI_THINKING:
        return (
          <div className={styles.typing_dots_small}>
            Собеседник подбирает слова...
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.chat_container}>
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.bubble} ${styles[msg.role]}`}
        >
          {msg.text}
        </div>
      ))}

      {/* Постоянный интерактивный блок ИИ-собеседника */}
      {aiStatus !== AI_STATUS.FINISHED && (
        <div className={styles.ai_wrapper}>
          <div className={styles.ai_avatar_wrapper}>
            <RiRobot2Fill className={styles.ai_icon} />
            {/* Точка пульсации активности, когда ИИ слушает или думает */}
            {(aiStatus === AI_STATUS.RECORDING ||
              aiStatus === AI_STATUS.AI_THINKING) && (
              <div className={styles.pulse_dot} />
            )}
          </div>

          {/* Бабл текущего статуса собеседника */}
          <div className={`${styles.bubble} ${styles.ai} ${styles.status_bubble}`}>
            {renderAiStatusText()}
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatEmpathySpark
