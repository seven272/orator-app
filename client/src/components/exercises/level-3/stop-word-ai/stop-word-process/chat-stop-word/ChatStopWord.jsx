import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatStopWord.module.css'
import { AI_STATUS } from '../../../../../../constants/exercises'


const ChatStopWord = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  // Плавная автопрокрутка к концу чата при обновлении сообщений или статусов
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  // Кастомные текстовые статусы для цензора-ИИ
  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return (
          <span className={styles.status_fade}>
            Жду вашего рассказа...
          </span>
        )
      case AI_STATUS.RECORDING:
        return (
          <span className={styles.status_active}>Слушаю монолог...</span>
        )
      case AI_STATUS.PROCESSING:
        return (
          <span className={styles.status_loading}>
            Сканирую на стоп-слова...
          </span>
        )
      case AI_STATUS.AI_THINKING:
        return (
          <div className={styles.typing_dots_small}>
            Подсчитываю нарушения...
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.chat_container}>
      {/* Лента сообщений сессии */}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.bubble} ${styles[msg.role]}`}
        >
          {msg.text}
        </div>
      ))}

      {/* Постоянная карточка ИИ-оппонента до финала */}
      {aiStatus !== AI_STATUS.FINISHED && (
        <div className={styles.ai_wrapper}>
          {/* Аватар робота */}
          <div className={styles.ai_avatar_wrapper}>
            <RiRobot2Fill className={styles.ai_icon} />
            {/* Пульсирующая точка занятости */}
            {(aiStatus === AI_STATUS.RECORDING ||
              aiStatus === AI_STATUS.AI_THINKING ||
              aiStatus === AI_STATUS.PROCESSING) && (
              <div className={styles.pulse_dot} />
            )}
          </div>

          {/* Бабл текущего статуса лингвистического анализа */}
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

export default ChatStopWord
