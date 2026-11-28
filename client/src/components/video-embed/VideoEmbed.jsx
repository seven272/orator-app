import React, { useState } from 'react'
import { TbPlayerPlayFilled, TbBrandYoutube, TbVideo } from 'react-icons/tb'
import styles from './VideoEmbed.module.css'

const VideoEmbed = ({ platform, videoId, title = 'Видеоразбор', coverImage = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false)

  if (!platform || !videoId) {
    return null
  }

  // Формируем URL для iframe с автозапуском по клику
  const getEmbedUrl = () => {
    if (platform === 'youtube') {
      return `https://youtube.com{videoId}?autoplay=1&rel=0`
    }
    if (platform === 'rutube') {
      return `https://rutube.ru{videoId}/?autoplay=1`
    }
    return ''
  }

  // Определяем превью-картинку до клика
  const getThumbnailUrl = () => {
    if (coverImage) return coverImage
    if (platform === 'youtube') {
      return `https://youtube.com{videoId}/hqdefault.jpg`
    }
    return ''
  }

  const thumbnailUrl = getThumbnailUrl()
  const embedUrl = getEmbedUrl()

  return (
    <div className={styles.video_wrapper}>
      {!isPlaying ? (
        <button
          type="button"
          className={styles.video_facade}
          onClick={() => setIsPlaying(true)}
          aria-label={`Смотреть видео: ${title}`}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className={styles.facade_poster}
              loading="lazy"
            />
          ) : (
            <div className={styles.facade_placeholder}>
              <TbVideo size={40} />
              <span>{title}</span>
            </div>
          )}

          <div className={styles.facade_overlay} />

          <div className={styles.play_button_circle}>
            <TbPlayerPlayFilled size={26} />
          </div>

          <span className={styles.platform_badge}>
            {platform === 'youtube' ? (
              <>
                <TbBrandYoutube size={14} /> YouTube
              </>
            ) : (
              <>
                <TbVideo size={14} /> RuTube
              </>
            )}
          </span>
        </button>
      ) : (
        <iframe
          className={styles.video_iframe}
          src={embedUrl}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      )}
    </div>
  )
}

export default VideoEmbed
