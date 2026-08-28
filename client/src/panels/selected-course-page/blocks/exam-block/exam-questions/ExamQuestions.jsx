import React, { useState, useEffect, useRef } from 'react'
import { useSpeechYandex } from '../../../../../hooks/useSpeechYandex'
import styles from './ExamQuestions.module.css'

const ExamQuestions = ({
  courseCode,
  isSubmitting,
  staticData,
  onSubmit,
  onCancel,
}) => {
  // 1. Подключаем хук Сбера со всей аудио-логикой (16кГц WAV)
  const {
    startListening,
    stopListening,
    audioBlob,
    isListening,
    resetTranscript,
  } = useSpeechYandex()

  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef(null)

  const isTimeValid = recordingTime >= 5 && recordingTime <= 120

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 2. Управляем таймером на основе статуса isListening из хука
  useEffect(() => {
    if (isListening) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 120) {
            stopListening() // Автоматическая остановка на 120 секундах
            return 120
          }
          return prev + 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isListening, stopListening])

  // Очистка при размонтировании (если пользователь вышел во время записи)
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
    }
  }, [])

  // 3. Хэндлер старта записи через Сбер-хук
  const handleStartRecording = () => {
    resetTranscript()
    setRecordingTime(0)
    startListening()
  }

  // 4. Хэндлер остановки записи
  const handleStopRecording = () => {
    if (isListening) {
      stopListening()
    }
  }

  // 5. Очистка записи (удаление)
  const handleResetRecording = () => {
    resetTranscript()
    setRecordingTime(0)
  }

  // 6. Финальная отправка готового WAV файла
  const handleRealSubmit = () => {
    if (!audioBlob) return

    const formData = new FormData()
    formData.append('courseCode', courseCode)

    // Передаем правильный WAV-файл (16kHz), сгенерированный хуком Сбера
    formData.append('audio', audioBlob, 'exam_record.wav')

    onSubmit({ formData })
  }

  return (
    <div className={styles.exam_container}>
      <div className={styles.exam_header}>
        <span
          className={
            isListening ? styles.live_badge_active : styles.live_badge
          }
        >
          {isListening ? 'Идет запись' : 'Запись ответа'}
        </span>
        <button
          className={styles.cancel_btn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Выйти
        </button>
      </div>

      <div className={styles.case_card}>
        <h3 className={styles.case_title}>
          {staticData?.taskTitle || 'Экзаменационный кейс'}
        </h3>
        <p className={styles.case_text}>
          {staticData?.taskDescription}
        </p>
      </div>

      <div className={styles.recorder_zone}>
        <div className={styles.timer_display}>
          <span
            className={`${styles.time} ${isListening ? styles.pulse : ''}`}
          >
            {formatTime(recordingTime)}
          </span>
          <span className={styles.time_limits}>
            Требуемый хронометраж: 01:00 — 02:00
          </span>
        </div>

        <div className={styles.progress_track}>
          <div
            className={`${styles.progress_bar} ${isTimeValid ? styles.progress_valid : ''}`}
            style={{
              width: `${Math.min((recordingTime / 120) * 100, 100)}%`,
            }}
          />
          <div className={styles.marker_60s} />
        </div>

        <div className={styles.controls}>
          {/* Если запись не идет и файла еще нет — показываем старт */}
          {!isListening && !audioBlob && (
            <button
              type="button"
              className={styles.record_btn}
              onClick={handleStartRecording}
              disabled={isSubmitting}
            >
              Начать запись
            </button>
          )}

          {/* Если запись идет — показываем стоп */}
          {isListening && (
            <button
              type="button"
              className={styles.stop_btn}
              onClick={handleStopRecording}
            >
              Остановить
            </button>
          )}

          {/* Если запись завершена и файл сформирован — даем послушать и перезаписать */}
          {!isListening && audioBlob && (
            <div className={styles.review_container}>
              <audio
                src={URL.createObjectURL(audioBlob)}
                controls
                className={styles.audio_player}
              />
              <button
                type="button"
                className={styles.retry_btn}
                onClick={handleResetRecording}
                disabled={isSubmitting}
              >
                Удалить и перезаписать
              </button>
            </div>
          )}
        </div>
      </div>

      {recordingTime > 0 && recordingTime < 60 && !isListening && (
        <p className={styles.warning_text}>
          Длина аудиозаписи меньше 60 секунд. Пожалуйста, разверните
          ответ подробнее.
        </p>
      )}

      {/* Кнопка отправки на бэк */}
      <button
        type="button"
        className={styles.submit_btn}
        onClick={handleRealSubmit}
        disabled={
          isListening || !audioBlob || !isTimeValid || isSubmitting
        }
      >
        {isSubmitting
          ? 'Нейросеть слушает и анализирует...'
          : 'Отправить на оценку ИИ'}
      </button>
    </div>
  )
}

export default ExamQuestions
