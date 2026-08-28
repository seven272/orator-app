import React, { useEffect, useState, useRef } from 'react'
import { CiMicrophoneOn } from 'react-icons/ci'
import { TbScoreboard } from 'react-icons/tb'
import { FaStopCircle, FaPlay, FaPause } from 'react-icons/fa' // Добавили иконки плеера

import styles from './PoemRapProcess.module.css'
import ChatPoemRap from './chat-poem-rap/ChatPoemRap' 
import { AI_STATUS } from '../../../../../constants/exercises'

const PoemRapProcess = ({
  numberRounds,
  rap,
  messages,
  timeLimit,
  aiStatus,
  audioBlob, // Принимаем записанный аудио-файл из родительского хука
  onStopRecording,
  onStartRecording,
  onFinishRap,
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

  // Сброс таймера и принудительное тушение звука при старте новой записи, чтобы старый трек не мешал в фоне
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

      {/* Шапка сессии с универсальным неймингом и прогресс-баром */}
      <div className={styles.session_header}>
        <div className={styles.progress_container}>
          <div className={styles.progress_text}>
            <div>
              {currentRound >= numberRounds
                ? 'Читка трека завершена'
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

      {/* Карточка подсказки текста, которая всегда на виду во время исполнения рэпа */}
      <div className={styles.prompt_card}>
        <span className={styles.prompt_label}>
          Зачитай этот стих как рэп-трек:
        </span>
        <p className={styles.prompt_text}>{rap.textToRead}</p>
        <div className={styles.mini_badges}>
          {rap.rhythmAnchors.map((anchor, i) => (
            <span key={i} className={styles.mini_badge}>
              🎤 {anchor}
            </span>
          ))}
        </div>
      </div>

      {/* Уникальный лог распознавания речи для рэп-тренажера */}
      <ChatPoemRap
        messages={messages}
        aiStatus={aiStatus}
        isAiThinking={isAiThinking}
      />

      {/* Подвал сессии с кнопками управления статусами записи */}
      <div className={styles.session_footer}>
        {aiStatus === AI_STATUS.IDLE && (
          <button onClick={onStartRecording} className={styles.record_full_btn}>
            Врубить бит и зачитать <CiMicrophoneOn size={25} />
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
                ? 'Сканирование ритма и флоу...'
                : 'ИИ-Продюсер сводит дорожки...'}
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
                <span>{isPlaying ? 'Пауза' : 'Слушать читку'}</span>
              </button>
            )}
            
            <button onClick={onFinishRap} className={styles.session_finish_btn}>
              Анализ ИИ <TbScoreboard size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default PoemRapProcess
