import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './PitchProcess.module.css'
import ChatPitch from './chat-pitch/ChatPitch' 
import { setPitchAiStatus } from '../../../../../redux/slices/ai-exercises/commercialPitchSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const PitchProcess = ({
  numberRounds,
  messages,
  interestProgress,
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

  // Проверка завершения всех раундов питча
  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setPitchAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Перезапуск таймера при старте нового раунда записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика обратного отсчета
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
      {/* Шапка прогресса и интереса инвестора */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Питч окончен'
                : `Защита стартапа: вопрос ${currentRound + 1} из ${numberRounds}`}
            </div>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.progress_bar_fill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Интерес Эдуарда: {interestProgress} из 100</span>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.value_bar_fill}
                style={{ width: `${interestProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Оболочка чат-диалога */}
      <ChatPitch
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Панель управления действиями пользователя */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
            Питчить стартап <CiMicrophoneOn size={25} />
          </button>
        )}

        {aiStatus === AI_STATUS.RECORDING && (
          <div className={styles.recording_wrapper}>
            <div className={styles.pulse_circle}></div>
            <span className={styles.timer_text}>{timer} сек</span>
            <button
              onClick={onStopRecording}
              className={styles.stop_btn}
            >
              <FaStopCircle size={45} />
            </button>
          </div>
        )}

        {(aiStatus === AI_STATUS.PROCESSING ||
          aiStatus === AI_STATUS.AI_THINKING) && (
          <div className={styles.status_wrapper}>
            <div className={styles.typing_dots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className={styles.status_text}>
              {aiStatus === AI_STATUS.PROCESSING
                ? 'Анализируем маркетинг...'
                : 'Эдуард считает будущую прибыль...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.finish_btn}
          >
            Выслушать решение инвестора <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default PitchProcess
