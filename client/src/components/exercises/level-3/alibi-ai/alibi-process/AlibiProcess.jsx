import React, { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './AlibiProcess.module.css'
import ChatAlibi from './chat-alibi/ChatAlibi'
import { setAlibiAiStatus } from '../../../../../redux/slices/ai-exercises/alibiSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const AlibiProcess = ({
  numberRounds,
  messages,
  credibilityProgress,
  timeLimit,
  aiStatus,
  onStopRecording,
  onStartRecording,
  onFinishDialog,
  isAiThinking,
}) => {
  const dispatch = useDispatch()
  const [timer, setTimer] = useState(timeLimit)

  const userMessagesCount = messages.filter(
    (msg) => msg.role === 'user',
  ).length
  const currentRound = userMessagesCount
  const progress = (currentRound / numberRounds) * 100

  useEffect(() => {
    if (
      currentRound >= numberRounds &&
      aiStatus !== AI_STATUS.FINISHED
    ) {
      dispatch(setAlibiAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Сброс таймера при новом раунде записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Таймер раунда
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
      {/* Прогресс-бары */}
      <div className={styles.debate_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Допрос окончен'
                : `Вопрос ${currentRound + 1} из ${numberRounds}`}
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
            <span>
              Доверие следователя: {credibilityProgress} из 100
            </span>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.warmth_bar_fill}
                style={{ width: `${credibilityProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ChatAlibi
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      <div className={styles.debate_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
            Нажмите, чтобы ответить <CiMicrophoneOn size={25} />
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
                ? 'Обработка речи...'
                : 'Прокурор изучает показания...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.debate_finish_btn}
          >
            Выслушать вердикт судьи <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default AlibiProcess
