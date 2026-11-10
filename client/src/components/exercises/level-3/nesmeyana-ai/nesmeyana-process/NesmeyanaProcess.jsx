import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './NesmeyanaProcess.module.css'
import ChatNesmeyana from './chat-nesmeyana/ChatNesmeyana'
import { setNesmeyanaAiStatus } from '../../../../../redux/slices/ai-exercises/nesmeyanaSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const NesmeyanaProcess = ({
  numberRounds,
  scenario,
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

  // Автоматический переход в финальный статус после записи монолога
  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setNesmeyanaAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Сброс таймера при начале записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Таймер обратного отсчета времени
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
      {/* Шапка прогресса записи */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds 
                ? 'Анекдот успешно записан' 
                : 'Идет запись выступления...'}
            </div>
            <div className={styles.progress_bar_bg}>
              <div className={styles.progress_bar_fill} style={{ width: `${progress || 15}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Шпаргалка с текстом шутки прямо перед глазами во время записи */}
      <div className={styles.joke_box}>
        <span className={styles.joke_title}>Читайте с выражением:</span>
        <p className={styles.joke_text_body}>{scenario.joke_body}</p>
      </div>

      <ChatNesmeyana messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Панель управления звуком */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Рассказать анекдот <CiMicrophoneOn size={25} />
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
                ? 'Слушаем вашу речь...' 
                : 'ИИ проверяет комедийные паузы...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.jargon_finish_btn}>
            Получить оценку Несмеяны <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default NesmeyanaProcess
