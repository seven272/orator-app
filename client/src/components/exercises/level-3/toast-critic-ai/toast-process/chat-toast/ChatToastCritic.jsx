import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatToastCritic.module.css'
import { AI_STATUS } from '../../../../../../constants/exercises'

const ChatToastCritic = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  // Плавная автопрокрутка чата вниз при обновлении списка сообщений
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return (
          <span className={styles.status_fade}>
            Застолье затихло, все ждут вашего тоста...
          </span>
        )
      case AI_STATUS.RECORDING:
        return (
          <span className={styles.status_active}>
            Гости слушают ваше выступление...
          </span>
        )
      case AI_STATUS.PROCESSING:
        return (
          <span className={styles.status_loading}>
            Оцифровка аудиозаписи...
          </span>
        )
      case AI_STATUS.AI_THINKING:
        return (
          <div className={styles.typing_dots_small}>
            Критик готовит авторитетную рецензию...
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

      {/* Постоянная ИИ-панель ресторанного критика / тамады */}
      {aiStatus !== AI_STATUS.FINISHED && (
        <div className={styles.ai_wrapper}>
          <div className={styles.ai_avatar_wrapper}>
            <RiRobot2Fill className={styles.ai_icon} />
            {/* Пульсирующий индикатор, когда ИИ слушает или думает */}
            {(aiStatus === AI_STATUS.RECORDING ||
              aiStatus === AI_STATUS.AI_THINKING) && (
              <div className={styles.pulse_dot} />
            )}
          </div>

          {/* Информационный бабл текущего статуса критика */}
          <div className={`${styles.bubble} ${styles.ai} ${styles.status_bubble}`}>
            {renderAiStatusText()}
          </div>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  )
}

export default ChatToastCritic
