import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './FreeArtistProcess.module.css'
import ChatFreeArtist from './chat-free-artist/ChatFreeArtist'
import { setFreeArtistAiStatus } from '../../../../../redux/slices/ai-exercises/freeArtistSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const FreeArtistProcess = ({
  numberRounds,
  topic,
  messages,
  timeLimit,
  aiStatus,
  onStopRecording,
  onStartRecording,
  onFinishDialog,
  isAiThinking,
}) => {
  const dispatch = useDispatch()
  const [timer, setTimer] = useState(timeLimit)

  const userMessagesCount = messages.filter((msg) => msg.role === 'user').length
  const currentRound = userMessagesCount
  const progress = (currentRound / numberRounds) * 100

  // Автоматический переход в статус завершения речевого раунда
  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setFreeArtistAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Инициализация таймера при старте записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика работы обратного отсчета времени монолога
  useEffect(() => {
    let interval
    if (aiStatus === AI_STATUS.RECORDING && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    }
    if (timer === 0 && aiStatus === AI_STATUS.RECORDING) {
      onStopRecording()
    }
    return () => clearInterval(interval)
  }, [aiStatus, timer, onStopRecording])

  return (
    <div className={styles.screen_running}>
      {/* Верхняя статус-панель записи монолога */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds 
                ? 'Речь успешно записана' 
                : 'Идет запись вашего монолога...'}
            </div>
            <div className={styles.progress_bar_bg}>
              <div className={styles.progress_bar_fill} style={{ width: `${progress || 15}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер кастомной темы выступления */}
      <div className={styles.keywords_box}>
        <span className={styles.keywords_title}>Тема текущего выступления:</span>
        <div className={styles.keywords_list}>
          <span className={styles.keyword_badge}>{topic}</span>
        </div>
      </div>

      <ChatFreeArtist messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Панель управления записью звука */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Начать выступление <CiMicrophoneOn size={25} />
          </button>
        )}

        {aiStatus === AI_STATUS.RECORDING && (
          <div className={styles.recording_wrapper}>
            <div className={styles.pulse_circle}></div>
            <span className={styles.timer_text}>{timer} сек</span>
            <button onClick={onStopRecording} className={styles.stop_btn}>
              <FaStopCircle size={45} />
            </button>
          </div>
        )}

        {(aiStatus === AI_STATUS.PROCESSING || aiStatus === AI_STATUS.AI_THINKING) && (
          <div className={styles.status_wrapper}>
            <div className={styles.typing_dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.status_text}>
              {aiStatus === AI_STATUS.PROCESSING 
                ? 'Слушаем ваше выступление...' 
                : 'ИИ анализирует структуру речи...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.jargon_finish_btn}>
            Получить рецензию эксперта <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default FreeArtistProcess
