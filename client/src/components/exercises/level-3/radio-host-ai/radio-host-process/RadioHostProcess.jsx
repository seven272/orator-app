import React, { useEffect, useState, useRef } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle, FaPlay, FaPause } from 'react-icons/fa' // Добавили иконки плеера

import styles from './RadioHostProcess.module.css'
import ChatRadioHost from './chat-radio-host/ChatRadioHost' 
import { AI_STATUS } from '../../../../../constants/exercises'

const RadioHostProcess = ({
  numberRounds,
  radio,
  messages,
  timeLimit,
  aiStatus,
  audioBlob, // Принимаем записанный аудио-файл из родительского хука
  onStopRecording,
  onStartRecording,
  onFinishRadio,
  isAiThinking,
}) => {
  const [timer, setTimer] = useState(timeLimit)
  const [currentRound, setCurrentRound] = useState(0)
  const [audioUrl, setAudioUrl] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  // Вычисляем количество реплик пользователя в истории чата
  const userMessagesCount = messages.filter((msg) => msg.role === 'user').length
  const progress = (currentRound / numberRounds) * 100

  // Безопасное выделение и очистка памяти при работе с локальными URL аудиофайлов
  useEffect(() => {
    let generatedUrl = null

    if (audioBlob && audioBlob.size > 0) {
      generatedUrl = URL.createObjectURL(audioBlob)
      setAudioUrl(generatedUrl)
    }

    return () => {
      if (generatedUrl) {
        URL.revokeObjectURL(generatedUrl) // Удаляем ссылку строго из текущего цикла рендера
      }
    }
  }, [audioBlob])

  useEffect(() => {
    if (userMessagesCount >= numberRounds && aiStatus === AI_STATUS.IDLE) {
      setCurrentRound(0)
    } else if (currentRound < numberRounds && aiStatus === AI_STATUS.FINISHED) {
      setCurrentRound(1)
    }
  }, [currentRound, numberRounds, aiStatus, userMessagesCount])

  // Перезапуск таймера и принудительное тушение звука при старте записи прямого эфира
  useEffect(() => {
    if (aiStatus === AI_STATUS.RECORDING) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setTimer(timeLimit)
      setAudioUrl(null)
      setIsPlaying(false)
    }
  }, [aiStatus, timeLimit])

  // Работа таймера раунда
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

  // Управление воспроизведением звука
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
      {/* Нативный скрытый элемент воспроизведения речи */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded} 
          style={{ display: 'none' }} 
        />
      )}

      {/* Шапка сессии с прогресс-баром и универсальным неймингом */}
      <div className={styles.session_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Прямой эфир завершен'
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

      {/* Карточка ТЗ, которая всегда перед глазами радиоведущего во время импровизации */}
      <div className={styles.prompt_card}>
        <span className={styles.prompt_label}>
          В эфире! Свяжи в один монолог:
        </span>
        <div className={styles.radio_live_tasks}>
          <p className={styles.radio_live_text}>
            ☀️ <b>Погода:</b> {radio.weather}
          </p>
          <p className={styles.radio_live_text}>
            💡 <b>Факт:</b> {radio.funnyFact}
          </p>
          <p className={styles.radio_live_text}>
            🎵 <b>Трек в конце:</b> «{radio.songTransition}»
          </p>
        </div>
      </div>

      {/* Уникальная лента транскрипции SaluteSpeech для Радиоведущего */}
      <ChatRadioHost
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Подвал сессии с кнопками управления записью */}
      <div className={styles.session_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Открыть микрофон и говорить <CiMicrophoneOn size={25} />
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
              <span></span><span></span><span></span>
            </div>
            <span className={styles.status_text}>
              {aiStatus === AI_STATUS.PROCESSING
                ? 'Сканирование эфирной паузы...'
                : 'Программный директор пишет рецензию...'}
            </span>
          </div>
        )}

        {/* Обновленный финал раунда: двухкнопочная группа плеера и завершения */}
        {aiStatus === AI_STATUS.FINISHED && (
          <div className={styles.finished_actions_group}>
            {audioUrl && (
              <button 
                onClick={togglePlayAudio} 
                className={`${styles.listen_btn} ${isPlaying ? styles.listen_active : ''}`}
              >
                {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
                <span>{isPlaying ? 'Пауза' : 'Слушать эфир'}</span>
              </button>
            )}
            
            <button onClick={onFinishRadio} className={styles.session_finish_btn}>
              Анализ ИИ <TbScoreboard size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default RadioHostProcess
