import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCheckRoomStatus } from '../../../../redux/slices/liveDuelSlice'

import LiveRoomHeader from './live-room-header/LiveRoomHeader'
import LiveRoomTopic from './live-room-topic/LiveRoomTopic'
import LiveRoomAudioRecorder from './live-room-audio-recorder/LiveRoomAudioRecorder'
import LiveRoomFeedback from './live-room-feedback/LiveRoomFeedback'
import LiveRoomChatTimeline from './live-room-chat-timeline/LiveRoomChatTimeline'
import styles from './LiveRoomReal.module.css'

const LiveRoomReal = () => {
  const dispatch = useDispatch()
  const { currentRoom } = useSelector((state) => state.liveDuel)
  const currentUserId = useSelector(
    (state) => state.profile?.user?._id || state.auth?.user?._id,
  )

  const roomId = currentRoom?._id
  const [playingTrackUrl, setPlayingTrackUrl] = useState(null)

  const audioRef = useRef(null)
  const pollingRef = useRef(null)

  const audioTracks = currentRoom?.audioTracks || []
  const tracksCount = audioTracks.length

  // Вычисляем раунд на лету
  const currentRound =
    tracksCount >= 4
      ? 'feedback'
      : tracksCount < 2
        ? 'speakerA'
        : 'speakerB'

  // Сравниваем ID внутри объектов, так как с бэкенда прилетает populate!
  const userAId = currentRoom?.userA?._id || currentRoom?.userA
  const userBId = currentRoom?.userB?._id || currentRoom?.userB

  const isSpeakerA = userAId?.toString() === currentUserId?.toString()

  // Железобетонная проверка очередности ходов
  const isMyTurn =
    currentRound !== 'feedback' &&
    ((tracksCount % 2 === 0 && isSpeakerA) || // Если четно (0, 2) — ход Спикера А
      (tracksCount % 2 !== 0 && !isSpeakerA)) // Если нечетно (1, 3) — ход Спикера Б

  const mySide = isSpeakerA
    ? currentRoom?.topic?.sideA
    : currentRoom?.topic?.sideB
  // Интервальный пуллинг обновлений (каждые 3 сек)
  useEffect(() => {
    if (!roomId || currentRound === 'feedback') return
    pollingRef.current = setInterval(() => {
      dispatch(fetchCheckRoomStatus({ roomId }))
        .unwrap()
        .then((res) => {
          if (
            res.room?.status === 'completed' ||
            (res.room?.audioTracks?.length || 0) >= 4
          ) {
            clearInterval(pollingRef.current)
          }
        })
    }, 3000)
    return () => clearInterval(pollingRef.current)
  }, [roomId, currentRound, dispatch])

  const handlePlayTrack = (fileUrl) => {
    if (playingTrackUrl === fileUrl) {
      audioRef.current.pause()
      setPlayingTrackUrl(null)
    } else {
      setPlayingTrackUrl(fileUrl)
      // Железобетонная минималистичная склейка путей статики
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      audioRef.current.src = `${isLocal ? 'http://localhost:5020' : 'https://govorix.ru'}/api/static/${fileUrl}`
      audioRef.current.load()
      audioRef.current.play().catch((e) => console.error(e))
      audioRef.current.onended = () => setPlayingTrackUrl(null)
    }
  }

  return (
    <div className={styles.duel_room_container}>
      <audio ref={audioRef} style={{ display: 'none' }} />

      <LiveRoomHeader
        currentRound={currentRound}
        tracksCount={tracksCount}
      />
      <LiveRoomTopic topic={currentRoom?.topic} mySide={mySide} />

      {/* Лента сообщений чата */}
      <LiveRoomChatTimeline
        audioTracks={audioTracks}
        currentUserId={currentUserId}
        playingTrackUrl={playingTrackUrl}
        onPlayTrack={handlePlayTrack}
      />

      {/* Панель действий */}
      <div className={styles.action_zone_wrapper}>
        {currentRound !== 'feedback' ? (
          isMyTurn ? (
            <LiveRoomAudioRecorder
              roomId={roomId}
              onUploadSuccess={() =>
                dispatch(fetchCheckRoomStatus({ roomId }))
              }
            />
          ) : (
            <div className={styles.opponent_turn_waiting_box}>
              <div className={styles.waiting_loader}>
                <div className={styles.loader_dot}></div>
                <div className={styles.loader_dot}></div>
                <div className={styles.loader_dot}></div>
              </div>
              <p className={styles.waiting_text}>
                ⏳ Оппонент формулирует мысль<span>.</span>
                <span>.</span>
                <span>.</span>
              </p>
            </div>
          )
        ) : (
          <LiveRoomFeedback
            roomId={roomId}
            currentRoom={currentRoom}
          />
        )}
      </div>
    </div>
  )
}

export default LiveRoomReal
