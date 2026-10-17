import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './ToastCriticProcess.module.css'
import ChatToastCritic from './chat-toast/ChatToastCritic'
import { setToastCriticAiStatus } from '../../../../../redux/slices/ai-exercises/toastCriticSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const ToastCriticProcess = ({
  numberRounds,
  scenario,
  messages,
  emotionalProgress,
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

  // Автоматический переход в финальный статус, когда тост записан
  useEffect(() => {
    if (currentRound >= numberRounds && aiStatus !== AI_STATUS.FINISHED) {
      dispatch(setToastCriticAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Инициализация и сброс таймера при старте записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика работы обратного отсчета времени
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
      {/* Верхняя панель прогресса без алиасов в стилях */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds 
                ? 'Тост произнесен' 
                : 'Запись праздничного выступления'}
            </div>
            <div className={styles.progress_bar_bg}>
              <div className={styles.progress_bar_fill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Эмоциональный отклик гостей: {emotionalProgress} из 100</span>
            <div className={styles.progress_bar_bg}>
              <div className={styles.reputation_bar_fill} style={{ width: `${emotionalProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер обязательной композиционной схемы тоста */}
      <div className={styles.keywords_box}>
        <span className={styles.keywords_title}>Соблюдай схему выступления:</span>
        <div className={styles.keywords_list}>
          <span className={styles.keyword_badge}>{scenario.schema}</span>
        </div>
      </div>

      <ChatToastCritic messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Панель управления записью звука */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Произнести торжественный тост <CiMicrophoneOn size={25} />
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
                : 'Критик ищет пошлые штампы...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.jargon_finish_btn}>
            Выслушать рецензию тамады <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default ToastCriticProcess
