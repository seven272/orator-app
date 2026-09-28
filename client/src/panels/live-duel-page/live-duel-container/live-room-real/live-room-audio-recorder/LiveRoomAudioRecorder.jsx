import React, { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  FiMic,
  FiSquare,
  FiSend,
  FiRefreshCw,
  FiPlay,
  FiPause,
} from 'react-icons/fi'
import { useAudioRecorder } from '../../../../../hooks/useAudioRecorder'
import { fetchSendAudioTrack } from '../../../../../redux/slices/liveDuelSlice'
import styles from './LiveRoomAudioRecorder.module.css'

const TIME_SPEECH = 60

const LiveRoomAudioRecorder = ({ roomId, onUploadSuccess }) => {
  const dispatch = useDispatch()
  const { loading } = useSelector((state) => state.liveDuel)
  const {
    isSupported,
    audioUrl,
    isRecording,
    startRecording,
    stopRecording,
    resetAudio,
  } = useAudioRecorder()

  const [isPlaying, setIsPlaying] = useState(false)
  const [timeLeft, setTimeLeft] = useState(TIME_SPEECH)
  const audioRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (isRecording) {
      setTimeLeft(TIME_SPEECH)
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            stopRecording()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [isRecording, stopRecording])

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      audioRef.current.onended = () => setIsPlaying(false)
    }
  }

  const handleSendTrack = async () => {
    if (!audioUrl) return
    try {
      const response = await fetch(audioUrl)
      const audioBlob = await response.blob()
      const formData = new FormData()
      formData.append('roomId', roomId)
      formData.append('audio', audioBlob, `voice-${Date.now()}.ogg`)

      dispatch(fetchSendAudioTrack(formData))
        .unwrap()
        .then((res) => {
          resetAudio()
          setIsPlaying(false)
          if (onUploadSuccess) onUploadSuccess(res.audioTracks)
        })
        .catch((err) => alert(`Ошибка отправки: ${err}`))
    } catch (e) {
      console.error(e)
    }
  }

  if (!isSupported)
    return (
      <div className={styles.error_banner}>
        ⚠️ Микрофон не поддерживается
      </div>
    )

  return (
    <div className={styles.recorder_container}>
      {isRecording && (
        <div className={styles.recording_pulse_box}>
          {/* Крупный, считываемый с первого взгляда таймер */}
          <div className={styles.timer_digits}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60) < 10 ? '0' : ''}{timeLeft % 60}
          </div>
          
          {/* Суб-блок со статусом и пульсирующей точкой */}
          <div className={styles.status_row}>
            <div className={styles.pulse_dot}></div>
            <span className={styles.recording_text}>Идет запись вашего ответа</span>
          </div>
          
          {/* Контрастная кнопка остановки */}
          <button className={styles.btn_stop} onClick={stopRecording}>
            <FiSquare size={16} /> 
            <span>Завершить запись</span>
          </button>
        </div>
      )}

      {!isRecording && !audioUrl && (
        <button
          className={styles.btn_start}
          onClick={startRecording}
          disabled={loading}
        >
          <FiMic /> <span>Начать запись</span>
        </button>
      )}

      {!isRecording && audioUrl && (
        <div className={styles.preview_box}>
          <audio src={audioUrl} ref={audioRef} />
          <div className={styles.preview_actions}>
            <button
              className={styles.btn_play}
              onClick={togglePlayback}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}{' '}
              {isPlaying ? 'Пауза' : 'Слушать'}
            </button>
            <button
              className={styles.btn_reset}
              onClick={resetAudio}
              disabled={loading}
            >
              <FiRefreshCw />
            </button>
          </div>
          <button
            className={styles.btn_send}
            onClick={handleSendTrack}
            disabled={loading}
          >
            <FiSend /> {loading ? 'Отправка...' : 'Отправить в баттл'}
          </button>
        </div>
      )}
    </div>
  )
}

export default LiveRoomAudioRecorder
