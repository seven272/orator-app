import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiMic, FiSquare, FiSend, FiRefreshCw, FiPlay, FiPause } from 'react-icons/fi'
import { useAudioRecorder } from '../../../../../hooks/useAudioRecorder'
import { fetchSendAudioTrack } from '../../../../../redux/slices/liveDuelSlice'
import styles from './LiveRoomAudioRecorder.module.css'

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

  // Локальный стейт для прослушивания записанного трека перед отправкой
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = React.useRef(null)

  if (!isSupported) {
    return (
      <div className={styles.error_banner}>
        ⚠️ Ваш браузер или устройство не поддерживают запись аудиосообщений. 
        Пожалуйста, обновите приложение.
      </div>
    )
  }

  // Управление предпрослушиванием
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

  // Физическая отправка аудиофайла на бэкенд через FormData
  const handleSendTrack = async () => {
    if (!audioUrl) return

    try {
      // Извлекаем Blob из локального URL, чтобы сформировать файл
      const response = await fetch(audioUrl)
      const audioBlob = await response.blob()

      const formData = new FormData()
      formData.append('roomId', roomId)
      // Ключ 'audio' строго соответствует мидлвару Multer на бэкенде
      formData.append('audio', audioBlob, `voice-${Date.now()}.ogg`)

      dispatch(fetchSendAudioTrack(formData))
        .unwrap()
        .then((res) => {
          resetAudio()
          setIsPlaying(false)
          if (onUploadSuccess) onUploadSuccess(res.audioTracks)
        })
        .catch((err) => {
          alert(`Не удалось отправить реплику: ${err}`)
        })
    } catch (error) {
      console.error('Ошибка подготовки аудиофайла:', error)
    }
  }

  return (
    <div className={styles.recorder_container}>
      {/* 1. Фаза: Запись идет прямо сейчас */}
      {isRecording && (
        <div className={styles.recording_pulse_box}>
          <div className={styles.pulse_dot}></div>
          <span className={styles.recording_text}>Идет запись вашего монолога...</span>
          <button className={styles.btn_stop} onClick={stopRecording}>
            <FiSquare size={18} />
            <span>Остановить</span>
          </button>
        </div>
      )}

      {/* 2. Фаза: Запись отсутствует и еще ничего не записано (Ожидание старта) */}
      {!isRecording && !audioUrl && (
        <div className={styles.idle_box}>
          <p className={styles.hint_text}>Нажмите кнопку ниже, сформулируйте ваши аргументы и запишите ответ.</p>
          <button className={styles.btn_start} onClick={startRecording} disabled={loading}>
            <FiMic size={20} className={styles.mic_icon} />
            <span>Начать запись реплики</span>
          </button>
        </div>
      )}

      {/* 3. Фаза: Монолог записан, ждет проверки и отправки на сервер */}
      {!isRecording && audioUrl && (
        <div className={styles.preview_box}>
          <h4 className={styles.preview_title}>🎙️ Реплика записана успешно</h4>
          
          {/* Скрытый тег аудио для локального плеера */}
          <audio src={audioUrl} ref={audioRef} />

          <div className={styles.preview_actions}>
            <button className={styles.btn_play} onClick={togglePlayback}>
              {isPlaying ? <FiPause size={18} /> : <FiPlay size={18} />}
              <span>{isPlaying ? 'Пауза' : 'Слушать запись'}</span>
            </button>

            <button className={styles.btn_reset} onClick={resetAudio} disabled={loading}>
              <FiRefreshCw size={16} />
              <span>Перезаписать</span>
            </button>
          </div>

          <button className={styles.btn_send} onClick={handleSendTrack} disabled={loading}>
            <FiSend size={18} />
            <span>{loading ? 'Отправка...' : 'Отправить реплику в баттл'}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default LiveRoomAudioRecorder
