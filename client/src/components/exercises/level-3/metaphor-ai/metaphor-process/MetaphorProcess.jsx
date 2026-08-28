import React, { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './MetaphorProcess.module.css'
import ChatMetaphor from './chat-metaphor/ChatMetaphor'
import { setMetaphorAiStatus } from '../../../../../redux/slices/ai-exercises/metaphorSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const MetaphorProcess = ({
  numberRounds,
  messages,
  understanding,
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
  const roundProgress = (currentRound / numberRounds) * 100

  // Гарантируем числовое значение шкалы понимания ИИ
  const safeUnderstanding = Number(understanding) || 0

  useEffect(() => {
    // Упражнение заканчивается, если раунды исчерпаны, либо ИИ всё понял (>= 95%) и замолчал
    const isRoundsLimitReached = currentRound >= numberRounds
    const isFullyUnderstood = safeUnderstanding >= 95

    if (
      (isRoundsLimitReached || isFullyUnderstood) &&
      aiStatus === AI_STATUS.IDLE
    ) {
      dispatch(setMetaphorAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, safeUnderstanding, aiStatus, dispatch])

  // Сброс таймера раунда при старте записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика таймера обратного отсчета
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
              {safeUnderstanding >= 95
                ? 'Термин успешно объяснен!'
                : currentRound >= numberRounds
                ? 'Попытки исчерпаны'
                : `Раунд объяснения ${currentRound + 1} из ${numberRounds}`}
            </div>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.progress_bar_fill}
                style={{ width: `${roundProgress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Понимание собеседника: {safeUnderstanding}%</span>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.understanding_bar_fill}
                style={{ width: `${safeUnderstanding}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Чат */}
      <ChatMetaphor
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Управление аудиозаписью */}
      <div className={styles.debate_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
            Подобрать метафору (запись) <CiMicrophoneOn size={25} />
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
                ? 'Анализ простоты вашей речи...'
                : 'Собеседник пытается сопоставить образы...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.debate_finish_btn}
          >
            Посмотреть оценку риторики <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default MetaphorProcess
