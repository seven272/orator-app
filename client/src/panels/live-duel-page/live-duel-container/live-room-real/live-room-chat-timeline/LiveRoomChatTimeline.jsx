import React from 'react'
import { FiVolume2, FiUser, FiPause, FiPlay } from 'react-icons/fi'
import styles from './LiveRoomChatTimeline.module.css'

const LiveRoomChatTimeline = ({
  audioTracks,
  currentUserId,
  playingTrackUrl,
  onPlayTrack,
}) => {
  const tracksCount = audioTracks.length

  return (
    <div className={styles.chat_timeline_card}>
      <h4 className={styles.timeline_title}>
        <FiVolume2 /> История реплик поединка ({tracksCount} из 4)
      </h4>

      {tracksCount === 0 ? (
        <div className={styles.empty_chat_hint}>
          История пуста. Спикер А должен записать вступительный
          монолог.
        </div>
      ) : (
        <div className={styles.tracks_list}>
          {audioTracks.map((track, idx) => {
            // Так как sender теперь объект, для проверки "я ли это" сравниваем ID
            const trackSenderObj = track.sender || {}
            const isTrackFromMe = trackSenderObj._id === currentUserId
            const isCurrentPlaying = playingTrackUrl === track.fileUrl

            // Определяем отображаемое имя (displayName -> firstName -> фолбэк)
            const speakerName =
              trackSenderObj.displayName ||
              trackSenderObj.firstName ||
              (isTrackFromMe ? 'Вы' : 'Оппонент')

            return (
              <div
                key={idx}
                className={`${styles.track_bubble_row} ${isTrackFromMe ? styles.row_my : styles.row_opponent}`}
              >
                {/* 🚀 ДИНАМИЧЕСКИЙ АВАТАР ИЛИ ЗАГЛУШКА */}
                <div className={styles.avatar_container}>
                  {trackSenderObj.avatar ? (
                    <img
                      src={trackSenderObj.avatar}
                      alt={speakerName}
                      className={styles.avatar_img}
                    />
                  ) : (
                    <div className={styles.avatar_mini}>
                      <FiUser />
                    </div>
                  )}
                </div>

                <div className={styles.track_bubble}>
                  {/* 🚀 РЕАЛЬНОЕ ИМЯ ОРАТОРА */}
                  <span className={styles.speaker_name_label}>
                    {speakerName} (Реплика #{idx + 1})
                  </span>

                  <button
                    className={`${styles.play_bubble_btn} ${isCurrentPlaying ? styles.playing_active : ''}`}
                    onClick={() => onPlayTrack(track.fileUrl)}
                  >
                    {isCurrentPlaying ? (
                      <FiPause size={14} />
                    ) : (
                      <FiPlay size={14} />
                    )}
                    <span>
                      {isCurrentPlaying
                        ? 'Пауза'
                        : 'Слушать аргумент'}
                    </span>
                  </button>

                  {track.timestamp && (
                    <span className={styles.track_time}>
                      {new Date(track.timestamp).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LiveRoomChatTimeline
