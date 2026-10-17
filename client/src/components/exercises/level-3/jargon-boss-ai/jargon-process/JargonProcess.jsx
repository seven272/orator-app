import { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './JargonProcess.module.css'
import ChatJargon from './chat-jargon/ChatJargon' // Сборщик баблов диалога (аналог ChatAlibi)
import { setJargonAiStatus } from '../../../../../redux/slices/ai-exercises/jargonBossSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const JargonProcess = ({
  numberRounds,
  scenario,
  messages,
  reputationProgress,
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
      dispatch(setJargonAiStatus(AI_STATUS.FINISHED))
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
      {/* Шапка прогресса и Авторитета */}
      <div className={styles.header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>{currentRound >= numberRounds ? 'Разборка окончена' : `Реплика ${currentRound + 1} из ${numberRounds}`}</div>
            <div className={styles.progress_bar_bg}>
              <div className={styles.progress_bar_fill} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Твой Авторитет: {reputationProgress} из 100</span>
            <div className={styles.progress_bar_bg}>
              <div className={styles.value_bar_fill} style={{ width: `${reputationProgress}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Информер обязательных к использованию слов */}
      <div className={styles.keywords_box}>
        <span className={styles.keywords_title}>Вплети в речь блатные слова:</span>
        <div className={styles.keywords_list}>
          {scenario.keywords.map((word, idx) => (
            <span key={idx} className={styles.keyword_badge}>
              {word}
            </span>
          ))}
        </div>
      </div>

      <ChatJargon messages={messages} aiStatus={aiStatus} isAiThinking={isAiThinking} />

      {/* Панель управления записью */}
      <div className={styles.footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Ответить оппоненту <CiMicrophoneOn size={25} />
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
              {aiStatus === AI_STATUS.PROCESSING ? 'Слушаем базар...' : 'Оппонент обдумывает ответ...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button onClick={onFinishDialog} className={styles.finish_btn}>
            Узнать исход тёрок <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default JargonProcess
