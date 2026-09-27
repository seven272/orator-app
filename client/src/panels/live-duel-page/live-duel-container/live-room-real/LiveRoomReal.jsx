import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FiPlay, FiPause, FiUser, FiVolume2 } from 'react-icons/fi'

import {
  resetLiveDuelState,
  fetchCheckRoomStatus,
} from '../../../../redux/slices/liveDuelSlice'

// Импортируем дочерние компоненты и новый аудиорекордер
import LiveRoomHeader from './live-room-header/LiveRoomHeader'
import LiveRoomTopic from './live-room-topic/LiveRoomTopic'
import LiveRoomAudioRecorder from './live-room-audio-recorder/LiveRoomAudioRecorder'
import LiveRoomFeedback from './live-room-feedback/LiveRoomFeedback'
import LiveRoomRewardModal from './live-room-reward-modal/LiveRoomRewardModal'

import styles from './LiveRoomReal.module.css'

const LiveRoomReal = () => {
  const dispatch = useDispatch()

  const { currentRoom } = useSelector((state) => state.liveDuel)
  const currentUserId = useSelector(
    (state) => state.profile?.user?._id || state.auth?.user?._id,
  )

  const roomId = currentRoom?._id
  const pollingRef = useRef(null)

  // Локальные состояния для плеера прослушивания реплик
  const [playingTrackUrl, setPlayingTrackUrl] = useState(null)
  const audioRef = useRef(null)

  // Определение ролей и позиций сторон
  const isSpeakerA = currentRoom?.userA === currentUserId
  const mySide = isSpeakerA
    ? currentRoom?.topic?.sideA
    : currentRoom?.topic?.sideB

  // Извлекаем массив треков и считаем их количество
  const audioTracks = currentRoom?.audioTracks || []
  const tracksCount = audioTracks.length

  // Динамическое определение раунда/состояния баттла
  let currentRound = 'intro'
  if (tracksCount === 0 || tracksCount === 1) {
    currentRound = 'speakerA'
  } else if (tracksCount === 2 || tracksCount === 3) {
    currentRound = 'speakerB'
  } else if (tracksCount >= 4) {
    currentRound = 'feedback'
  }

  // Определение активности хода текущего игрока
  // Если треков четное количество (0, 2) — ходит Спикер А. Если нечетное (1, 3) — ходит Спикер Б.
  const isMyTurn =
    currentRound !== 'feedback' &&
    ((tracksCount % 2 === 0 && isSpeakerA) || (tracksCount % 2 !== 0 && !isSpeakerA))

  // Состояния для премиальной модалки наград
  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardsData, setRewardsData] = useState(null)

  // 1. Бесконечный живой пуллинг комнаты (каждые 3 секунды) для получения новых аудиозаписей
  useEffect(() => {
    if (!roomId || currentRound === 'feedback') return

    pollingRef.current = setInterval(() => {
      dispatch(fetchCheckRoomStatus({ roomId }))
        .unwrap()
        .then((res) => {
          // Если оппонент завершил баттл или прилетели новые треки
          if (res.room?.status === 'completed' || (res.room?.audioTracks?.length || 0) >= 4) {
            clearInterval(pollingRef.current)
          }
        })
        .catch((err) => {
          console.error('Ошибка пуллинга состояния чата:', err)
        })
    }, 3000)

    return () => clearInterval(pollingRef.current)
  }, [roomId, currentRound, dispatch])

  // 2. Управление плеером аудиореплик
  const handlePlayTrack = (fileUrl) => {
    if (playingTrackUrl === fileUrl) {
      audioRef.current.pause()
      setPlayingTrackUrl(null)
    } else {
      setPlayingTrackUrl(fileUrl)
      // Преобразуем относительный путь сервера в полный URL при необходимости
      const fullUrl = fileUrl.startsWith('http') ? fileUrl : `/${fileUrl}`
      
      if (audioRef.current) {
        audioRef.current.src = fullUrl
        audioRef.current.play()
        audioRef.current.onended = () => setPlayingTrackUrl(null)
      }
    }
  }

  // Обновление стейта при успешной отправке трека из дочернего компонента
  const handleUploadSuccess = () => {
    if (roomId) {
      dispatch(fetchCheckRoomStatus({ roomId }))
    }
  }

  // Колбэк успешного завершения голосования
  const handleVoteSuccess = (data) => {
    setRewardsData(data)
    setShowRewardModal(true)
  }

  const handleCloseModal = () => {
    setShowRewardModal(false)
    dispatch(resetLiveDuelState())
  }

  return (
    <div className={styles.duel_room_container}>
      {/* Скрытый тег для воспроизведения сообщений из чата */}
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* Статус-бар ходов баттла */}
      <LiveRoomHeader currentRound={currentRound} timeLeft={0} />

      {/* Карточка темы и тезис текущего оратора */}
      <LiveRoomTopic topic={currentRoom?.topic} mySide={mySide} />

      {/* Блок асинхронного аудиочата */}
      <div className={styles.chat_timeline_card}>
        <h4 className={styles.timeline_title}>
          <FiVolume2 /> История реплик поединка ({tracksCount} из 4)
        </h4>
        
        {tracksCount === 0 ? (
          <div className={styles.empty_chat_hint}>
            История пуста. Спикер А должен записать вступительный монолог.
          </div>
        ) : (
          <div className={styles.tracks_list}>
            {audioTracks.map((track, idx) => {
              const isTrackFromMe = track.sender === currentUserId
              return (
                <div 
                  key={idx} 
                  className={`${styles.track_bubble_row} ${isTrackFromMe ? styles.row_my : styles.row_opponent}`}
                >
                  <div className={styles.avatar_mini}>
                    <FiUser />
                  </div>
                  <div className={styles.track_bubble}>
                    <span className={styles.speaker_name_label}>
                      {isTrackFromMe ? 'Вы' : 'Оппонент'} (Реплика #{idx + 1})
                    </span>
                    <button 
                      className={styles.play_bubble_btn}
                      onClick={() => handlePlayTrack(track.fileUrl)}
                    >
                      {playingTrackUrl === track.fileUrl ? <FiPause /> : <FiPlay />}
                      <span>{playingTrackUrl === track.fileUrl ? 'Пауза' : 'Слушать аргумент'}</span>
                    </button>
                    <span className={styles.track_time}>
                      {new Date(track.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Интерактивная зона действий: Ход / Ожидание ходов / Финал */}
      <div className={styles.action_zone_wrapper}>
        {currentRound !== 'feedback' ? (
          <div className={styles.recorder_status_box}>
            {isMyTurn ? (
              <div className={styles.my_turn_active_box}>
                <div className={styles.turn_alert_text}>👉 Сейчас ваш ход! Запишите аудио-ответ:</div>
                <LiveRoomAudioRecorder 
                  roomId={roomId} 
                  onUploadSuccess={handleUploadSuccess} 
                />
              </div>
            ) : (
              <div className={styles.opponent_turn_waiting_box}>
                <div className={styles.spinner_mini}></div>
                <p className={styles.waiting_text}>
                  ⏳ Оппонент формулирует мысль. Ожидайте появление аудио-реплики...
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Экран взаимного оценивания после 4 реплик */
          <LiveRoomFeedback
            roomId={roomId}
            currentRoom={currentRoom}
            onVoteSuccess={handleVoteSuccess}
          />
        )}
      </div>

      {/* Итоговое премиум-окно награждения за баттл */}
      {showRewardModal && rewardsData && (
        <LiveRoomRewardModal
          data={rewardsData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default LiveRoomReal
