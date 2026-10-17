import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './AssociationMasterProcess.module.css'
import ChatAssociationMaster from './chat-association/ChatAssociationMaster'
import { setAssociationMasterAiStatus } from '../../../../../redux/slices/ai-exercises/associationMasterSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const AssociationMasterProcess = ({
  numberRounds,
  scenario,
  messages,
  originalityProgress,
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

  // Переключение в финальное состояние ИИ, когда единственный раунд метафоры записан
  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setAssociationMasterAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Сброс таймера при старте записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика работы таймера
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
      {/* Панель прогресса без алиасов в стилях */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds 
                ? 'Мост построен' 
                : 'Построение ассоциативной связи'}
            </div>
            <div className={styles.progress_bar_bg}>
              <div className={styles.progress_bar_fill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Текущая оригинальность: {originalityProgress} из 100</span>
            <div className={styles.progress_bar_bg}>
              <div className={styles.reputation_bar_fill} style={{ width: `${originalityProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер полярных понятий */}
      <div className={styles.keywords_box}>
        <span className={styles.keywords_title}>Логически свяжите понятия:</span>
        <div className={styles.keywords_list}>
          <span className={styles.keyword_badge}>{scenario.concept_A}</span>
          <span className={styles.concepts_arrow}>➔</span>
          <span className={styles.keyword_badge}>{scenario.concept_B}</span>
        </div>
      </div>

      <ChatAssociationMaster messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Панель управления записью звука */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Записать ораторский мост <CiMicrophoneOn size={25} />
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
                ? 'Анализируем богатство речи...' 
                : 'Лингвист ищет банальные связи...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.jargon_finish_btn}>
            Получить вердикт лингвиста <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AssociationMasterProcess
