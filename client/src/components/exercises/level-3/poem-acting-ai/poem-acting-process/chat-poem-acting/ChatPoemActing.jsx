import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatPoemActing.module.css'
import { AI_STATUS } from '../../../../../../constants/exercises'

const ChatPoemActing = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return <span className={styles.status_fade}>Камера, мотор, жду реплики...</span>
      case AI_STATUS.RECORDING:
        return <span className={styles.status_active}>Запись идет, отыгрывайте!</span>
      case AI_STATUS.PROCESSING:
        return <span className={styles.status_loading}>Обрабатываю звуковую дорожку...</span>
      case AI_STATUS.AI_THINKING:
        return <div className={styles.typing_dots_small}>Выставляю оценки за драму...</div>
      default:
        return null
    }
  }

  return (
    <div className={styles.chat_container}>
      {messages.map((msg, i) => (
        <div key={i} className={`${styles.bubble} ${styles[msg.role]}`}>
          {msg.text}
        </div>
      ))}

      {aiStatus !== AI_STATUS.FINISHED && (
        <div className={styles.ai_wrapper}>
          <div className={styles.ai_avatar_wrapper}>
            <RiRobot2Fill className={styles.ai_icon} />
            {(aiStatus === AI_STATUS.RECORDING || aiStatus === AI_STATUS.AI_THINKING) && (
              <div className={styles.pulse_dot} />
            )}
          </div>

          <div className={`${styles.bubble} ${styles.ai} ${styles.status_bubble}`}>
            {renderAiStatusText()}
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatPoemActing
