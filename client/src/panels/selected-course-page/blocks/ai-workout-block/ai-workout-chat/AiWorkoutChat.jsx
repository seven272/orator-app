import React, { useState, useEffect, useRef } from 'react'
import styles from './AiWorkoutChat.module.css'

const AiWorkoutChat = ({
  aiChat,
  chatStatus,
  config, // Принимаем конфиг тренажера
  onStartRecording,
  onStopRecording,
  onFinishTrainer,
  onExit,
}) => {
  const { preview, messages, aiStatus } = aiChat
  const isLoading = chatStatus === 'loading'

  const [timeLeft, setTimeLeft] = useState(20)
  const timerRef = useRef(null)
  const messagesEndRef = useRef(null)

  // 2. Функция для прокрутки вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // 3. Эффект для автоматического скролла при любых изменениях в чате
  useEffect(() => {
    scrollToBottom()
  }, [messages, aiStatus, isLoading]) // Срабатывает на новые сообщения, смену статусов и лоадер

  useEffect(() => {
    if (aiStatus === 'recording') {
      setTimeLeft(20)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            onStopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [aiStatus, onStopRecording])

  const getTimerClass = () => {
    if (timeLeft <= 5) return styles.timer_critical
    if (timeLeft <= 10) return styles.timer_warning
    return styles.timer_normal
  }

  return (
    <>
      <div className={styles.session_card}>
        <div className={styles.session_header}>
          <span className={styles.session_label}>
            {config.ui.sessionLabel} {/* ДИНАМИЧЕСКИЙ ТЕКСТ ШАПКИ */}
          </span>
          <button className={styles.exit_button} onClick={onExit}>
            Выйти из тренажера 
          </button>
        </div>
        <p className={styles.context_subtitle}>{preview}</p>
      </div>

      <div className={styles.chat_window}>
        <div className={styles.chat_history}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.role === 'user' ? styles.msg_user : styles.msg_ai
              }
            >
              <strong>
                {msg.role === 'user'
                  ? 'Вы: '
                  : `${config.ui.aiRoleName}: `}{' '}
                {/* ДИНАМИЧЕСКАЯ РОЛЬ */}
              </strong>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {aiStatus === 'ready_to_finish' ? (
          <div className={styles.finish_zone}>
            <p className={styles.finish_text}>
              {config.ui.finishText} {/* ДИНАМИЧЕСКИЙ ТЕКСТ ФИНАЛА */}
            </p>
            <button
              className={styles.finish_button}
              disabled={isLoading}
              onClick={onFinishTrainer}
            >
              {isLoading
                ? config.ui.finishButtonLoadingText
                : config.ui.finishButtonText}
            </button>
          </div>
        ) : (
          <div className={styles.audio_zone}>
            {aiStatus === 'recording' && (
              <div
                className={`${styles.timer_badge} ${getTimerClass()}`}
              >
                ⏱️ Осталось времени: <strong>{timeLeft} сек.</strong>
              </div>
            )}

            <div className={styles.input_zone}>
              {aiStatus === 'recording' ? (
                <button
                  className={`${styles.record_button} ${styles.recording_active}`}
                  onClick={onStopRecording}
                >
                  🛑 Остановить запись и отправить
                </button>
              ) : (
                <button
                  className={styles.record_button}
                  disabled={isLoading || aiStatus === 'ai_thinking'}
                  onClick={onStartRecording}
                >
                  {aiStatus === 'ai_thinking' || isLoading
                    ? config.ui.thinkingText // ДИНАМИЧЕСКИЙ ТЕКСТ ОЖИДАНИЯ
                    : '🎤 Включить микрофон и сказать ответ'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default AiWorkoutChat
