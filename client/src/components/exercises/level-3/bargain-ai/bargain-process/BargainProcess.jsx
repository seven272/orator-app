import React, { useEffect, useState } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle } from 'react-icons/fa'
import { useDispatch } from 'react-redux'

import styles from './BargainProcess.module.css'
import ChatBargain from './chat-bargain/ChatBargain'
import { setBargainAiStatus } from '../../../../../redux/slices/ai-exercises/bargainSlice'
import { AI_STATUS } from '../../../../../constants/exercises'

const BargainProcess = ({
  numberRounds,
  messages,
  currentPrice,
  targetPrice,
  situation,
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

  // Гарантируем числовой тип данных для корректной работы математики и .toLocaleString()
  const safeCurrentPrice = Number(currentPrice) || 0
  const safeTargetPrice = Number(targetPrice) || 0
  const safeInitialPrice =
    Number(situation?.initial_price) || safeCurrentPrice

  const totalDiscountRange = safeInitialPrice - safeTargetPrice
  const currentDiscountGiven = safeInitialPrice - safeCurrentPrice

  const priceBarProgress =
    totalDiscountRange > 0
      ? Math.min(
          Math.max(
            (currentDiscountGiven / totalDiscountRange) * 100,
            0,
          ),
          100,
        )
      : 0

  useEffect(() => {
    // Защита: проверяем условия финиша только если игра реально началась (safeCurrentPrice > 0)
    const isPriceTargetReached =
      safeCurrentPrice > 0 && safeCurrentPrice <= safeTargetPrice
    const isRoundsLimitReached = currentRound >= numberRounds

    if (
      (isRoundsLimitReached || isPriceTargetReached) &&
      aiStatus === AI_STATUS.IDLE
    ) {
      dispatch(setBargainAiStatus(AI_STATUS.FINISHED))
    }
  }, [
    currentRound,
    numberRounds,
    safeCurrentPrice,
    safeTargetPrice,
    aiStatus,
    dispatch,
  ])

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
      <div className={styles.debate_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {safeCurrentPrice <= safeTargetPrice
                ? 'Идеальная цена достигнута!'
                : currentRound >= numberRounds
                  ? 'Торг окончен'
                  : `Раунд торга ${currentRound + 1} из ${numberRounds}`}
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
            <span>
              Текущая цена: {safeCurrentPrice.toLocaleString()} ₽
              (Цель: {safeTargetPrice.toLocaleString()} ₽)
            </span>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.price_bar_fill}
                style={{ width: `${priceBarProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ChatBargain
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
            Сбить цену (запись ответа) <CiMicrophoneOn size={25} />
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
                ? 'Обработка вашей речи...'
                : 'Продавец обдумывает скидку...'}
            </span>
          </div>
        )}

        {aiStatus === AI_STATUS.FINISHED && (
          <button
            onClick={onFinishDialog}
            className={styles.debate_finish_btn}
          >
            Узнать решение по сделке <TbScoreboard size={25} />
          </button>
        )}
      </div>
    </div>
  )
}

export default BargainProcess
