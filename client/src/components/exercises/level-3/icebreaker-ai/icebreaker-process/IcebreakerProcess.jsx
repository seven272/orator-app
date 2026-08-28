import React, { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './IcebreakerProcess.module.css'
import ChatIcebreaker from './chat-icebreaker/ChatIcebreaker'
import { setIcebreakerAiStatus } from '../../../../../redux/slices/ai-exercises/icebreakerSlice'

import { AI_STATUS } from '../../../../../constants/exercises'

const IcebreakerProcess = ({
  numberRounds,
  messages,
  warmthProgress,
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
      // Здесь логика завершения или переключения на экран результатов
      dispatch(setIcebreakerAiStatus(AI_STATUS.FINISHED))
    }
  }, [currentRound, numberRounds, aiStatus])

  // Сброс таймера при новом раунде записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      setTimer(timeLimit)
    }
  }, [aiStatus])

  // таймер раунда
  useEffect(() => {
    let interval
    // Таймер тикает ТОЛЬКО когда идет запись
    if (aiStatus === AI_STATUS.RECORDING && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
    }
    // Авто-стоп по истечении времени
    if (timer === 0 && aiStatus === AI_STATUS.RECORDING) {
      onStopRecording() // Функция, которая меняет статус на PROCESSING
    }
    return () => clearInterval(interval)
  }, [aiStatus, timer])

  return (
    <div className={styles.screen_running}>
      {/* Прогресс-бар*/}
      <div className={styles.debate_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Дебаты окончены'
                : `Раунд ${currentRound} из ${numberRounds}`}
            </div>
            {/* Серый фон бара */}
            <div className={styles.progress_bar_bg}>
              {/* Синяя заливка прогресса */}
              <div
                className={styles.progress_bar_fill}
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <span>Душевность беседы {warmthProgress} из 100</span>
            {/* Серый фон бара */}
            <div className={styles.progress_bar_bg}>
              {/* динамическая заливка прогресса */}
              <div
                className={styles.warmth_bar_fill}
                style={{
                  width: `${warmthProgress}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <ChatIcebreaker
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
            Нажмите, чтобы <CiMicrophoneOn size={25} />
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
                : 'ИИ готовит ответ...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.debate_finish_btn}
          >
            Завершить и проанализировать <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default IcebreakerProcess
