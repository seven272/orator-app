import React, { useEffect, useState, useRef } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle, FaPlay, FaPause } from 'react-icons/fa' // Добавили иконки плеера

import styles from './HistoricalProcess.module.css'
import ChatHistorical from './chat-historical/ChatHistorical'
import { AI_STATUS } from '../../../../../constants/exercises'

const HistoricalProcess = ({
  numberRounds,
  messages,
  timeLimit,
  aiStatus,
  audioBlob, // Получаем аудио-блоб из родителя
  onStopRecording,
  onStartRecording,
  onFinishHistorical,
  isAiThinking,
}) => {
  const [timer, setTimer] = useState(timeLimit)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const audioRef = useRef(null)
  const currentRound = messages.filter(
    (msg) => msg.role === 'user',
  ).length
  const progress = (currentRound / numberRounds) * 100

  // Эффект для создания локальной ссылки на аудиозапись, когда блоб готов
  useEffect(() => {
    if (audioBlob && audioBlob.size > 0) {
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)
    }
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl) // Чистим память при демонтаже
    }
  }, [audioBlob])

  // Сброс таймера и плеера при старте новой записи
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
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

  // Логика управления плеером
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
      {/* Скрытый тег аудио для воспроизведения */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}

      <div className={styles.historical_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>Раунд 1 из 1</div>
          </div>
          <div className={styles.progress_bar_bg}>
            <div
              className={styles.progress_bar_fill}
              style={{
                width: `${aiStatus === AI_STATUS.FINISHED ? 100 : progress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <ChatHistorical
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      <div className={styles.historical_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button
            onClick={onStartRecording}
            className={styles.record_full_btn}
          >
           Начать речь{' '}
            <CiMicrophoneOn size={25} />
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
                ? 'Распознавание Yandex SpeechKit...'
                : 'Профессор риторики оценивает смысл...'}
            </span>
          </div>
        )}

        {/* Изменено оформление финала: добавляем кнопку прослушивания */}
        {aiStatus === AI_STATUS.FINISHED && (
          <div className={styles.finished_actions_group}>
            {audioUrl && (
              <button
                onClick={togglePlayAudio}
                className={`${styles.listen_btn} ${isPlaying ? styles.listen_active : ''}`}
                title={isPlaying ? 'Пауза' : 'Прослушать свою речь'}
              >
                {isPlaying ? (
                  <FaPause size={18} />
                ) : (
                  <FaPlay size={18} />
                )}
                <span>{isPlaying ? 'Пауза' : 'Слушать запись'}</span>
              </button>
            )}

            <button
              onClick={onFinishHistorical}
              className={styles.historical_finish_btn}
            >
              Анализ ИИ <TbScoreboard size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoricalProcess
