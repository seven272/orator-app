import { useRef, useEffect } from 'react'
import { RiRobot2Fill } from 'react-icons/ri'

import styles from './ChatRadioHost.module.css' // Изолированные стили чата
import { AI_STATUS } from '../../../../../../constants/exercises'

const ChatRadioHost = ({ messages, aiStatus, isAiThinking }) => {
  const chatEndRef = useRef(null)

  // Плавная автопрокрутка к последней расшифровке или смене статуса
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiThinking])

  // Кастомные эфирные статусы ИИ-директора для радио-тренажера
  const renderAiStatusText = () => {
    switch (aiStatus) {
      case AI_STATUS.IDLE:
        return (
          <span className={styles.status_fade}>
            Микрофон отключен. Жду выхода в эфир...
          </span>
        )
      case AI_STATUS.RECORDING:
        return (
          <span className={styles.status_active}>
            🔴 В ЭФИРЕ! Говорите, пульт открыт...
          </span>
        )
      case AI_STATUS.PROCESSING:
        return (
          <span className={styles.status_loading}>
            Анализирую плотность эфирного потока...
          </span>
        )
      case AI_STATUS.AI_THINKING:
        return (
          <div className={styles.typing_dots_small}>
            Проверяю эфир на наличие «гэгов» и пауз...
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className={styles.chat_container}>
      {/* Вывод расшифровок речи из истории */}
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`${styles.bubble} ${styles[msg.role]}`}
        >
          {msg.text}
        </div>
      ))}

      {/* Постоянный интерактивный блок ИИ-директора радиостанции */}
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

export default ChatRadioHost
