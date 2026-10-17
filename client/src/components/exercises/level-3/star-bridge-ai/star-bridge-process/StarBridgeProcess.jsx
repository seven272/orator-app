import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './StarBridgeProcess.module.css'
import ChatStarBridge from './chat-star-bridge/ChatStarBridge'
import { setStarAiStatus } from '../../../../../redux/slices/ai-exercises/starBridgeSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const StarBridgeProcess = ({
  numberRounds,
  scenario,
  messages,
  attentionProgress,
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

  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setStarAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

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
      {/* Абстрактная верхняя панель прогресса */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds 
                ? 'Питч завершен' 
                : `Этаж лифта ${currentRound + 1} из ${numberRounds}`}
            </div>
            <div className={styles.bar_bg}>
              <div className={styles.bar_fill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Внимание кумира: {attentionProgress} из 100</span>
            <div className={styles.bar_bg}>
              <div className={styles.attention_bar_fill} style={{ width: `${attentionProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер жесткого фокуса кумира */}
      <div className={styles.target_box}>
        <span className={styles.target_title}>Критический фильтр кумира:</span>
        <p className={styles.target_text}>{scenario.target_focus}</p>
      </div>

      <ChatStarBridge messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Универсальный футер контроля записи */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_btn}>
            Выдать хук оффера <CiMicrophoneOn size={25} />
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
              {aiStatus === AI_STATUS.PROCESSING ? 'Распознаем темп оффера...' : 'Кумир отрывается от экрана...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.finish_btn}>
            Узнать исход встречи <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default StarBridgeProcess
