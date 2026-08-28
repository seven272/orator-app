import React, { useEffect, useState, useRef } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle, FaPlay, FaPause } from 'react-icons/fa'

import styles from './RandomWordProcess.module.css'
import ChatRandomWord from './chat-random-word/ChatRandomWord'

import { AI_STATUS } from '../../../../../constants/exercises'

const RandomWordProcess = ({
  numberRounds,
  messages,
  timeLimit,
  aiStatus,
  audioBlob,
  onStopRecording,
  onStartRecording,
  onFinishScenario,
  isAiThinking,
}) => {
  const [timer, setTimer] = useState(timeLimit)
  const [currentRound, setCurrentRound] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const userMessagesCount = messages.filter(
    (msg) => msg.role === 'user',
  ).length
  const progress = (currentRound / numberRounds) * 100

  // ИСПРАВЛЕНИЕ 1: Безопасное выделение и очистка памяти без замыканий стейта
  useEffect(() => {
    let generatedUrl = null

    if (audioBlob && audioBlob.size > 0) {
      generatedUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(generatedUrl)
    }

    return () => {
      if (generatedUrl) {
        URL.revokeObjectURL(generatedUrl) // Удаляем строго ту ссылку, которую создали в этом цикле
      }
    }
  }, [audioBlob])

  useEffect(() => {
    if (
      userMessagesCount >= numberRounds &&
      aiStatus === AI_STATUS.IDLE
    ) {
      setCurrentRound(0)
    } else if (
      currentRound < numberRounds &&
      aiStatus === AI_STATUS.FINISHED
    ) {
      setCurrentRound(1)
    }
  }, [currentRound, numberRounds, aiStatus, userMessagesCount])

  // ИСПРАВЛЕНИЕ 2: Экстренная остановка играющего плеера при старте новой записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      if (audioRef.current) {
        audioRef.current.pause() // Принудительно тушим звук в фоне
        audioRef.current.currentTime = 0
      }
      setTimer(timeLimit)
      setAudioUrl(null)
      setIsPlaying(false)
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

  // Управление воспроизведением
  const togglePlayAudio = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  return (
    <div className={styles.screen_running}>
      {/* ИСПРАВЛЕНИЕ 3: Нативный тег аудио для физического воспроизведения звука */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}

      {/* Прогресс-бар */}
      <div className={styles.debate_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Упражнение окончено'
                : `Раунд ${currentRound} из ${numberRounds}`}
            </div>
            <div className={styles.progress_bar_bg}>
              <div
                className={styles.progress_bar_fill}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <ChatRandomWord
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
          <div className={styles.finished_actions_group}>
            {audioUrl && (
              <button
                onClick={togglePlayAudio}
                className={`${styles.listen_btn} ${isPlaying ? styles.listen_active : ''}`}
              >
                {isPlaying ? (
                  <FaPause size={16} />
                ) : (
                  <FaPlay size={16} />
                )}
                <span>{isPlaying ? 'Пауза' : 'Слушать речь'}</span>
              </button>
            )}

            <button
              onClick={onFinishScenario}
              className={styles.debate_finish_btn}
            >
              Анализ ИИ <TbScoreboard size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RandomWordProcess
