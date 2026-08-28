import React, { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './KnockoutProcess.module.css'
import ChatKnockout from './chat-knockout/ChatKnockout'
import { setKnockoutAiStatus } from '../../../../../redux/slices/ai-exercises/knockoutSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const KnockoutProcess = ({
  numberRounds,
  messages,
  audienceReputation,
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

  // Числовое значение шкалы репутации
  const safeReputation = Number(audienceReputation) ?? 50

  useEffect(() => {
    // Игра завершается, если раунды исчерпаны и ИИ замолчал
    if (currentRound >= numberRounds && aiStatus === AI_STATUS.IDLE) {
      dispatch(setKnockoutAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus, dispatch])

  // Сброс таймера раунда при включении записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus, timeLimit])

  // Логика обратного отсчета таймера
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
      {/* Шапка с прогресс-барами */}
      <div className={styles.debate_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Выступление окончено'
                : `Реплика ${currentRound + 1} из ${numberRounds}`}
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
            <span>Одобрение зала: {safeReputation}%</span>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.reputation_bar_fill}
                style={{ width: `${safeReputation}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Чат-интерфейс */}
      <ChatKnockout
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Футер управления записью */}
      <div className={styles.debate_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
            Выдать панчлайн (запись) <CiMicrophoneOn size={25} />
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
                ? 'Зал переваривает шутку...'
                : 'Оппонент готовит ответный подкол...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.debate_finish_btn}
          >
            Узнать вердикт продюсера <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default KnockoutProcess
