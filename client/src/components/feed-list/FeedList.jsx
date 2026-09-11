import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import {
  fetchFeedEvents,
  fetchSendCongratulation,
  resetFeedState,
} from '../../redux/slices/feedSlice'
import styles from './FeedList.module.css'

const FeedList = () => {
  const dispatch = useDispatch()

  // Берем данные авторизации, чтобы понимать, гость перед нами или нет
  const { user: currentUser } = useSelector((state) => state.auth)
  const isAuthenticated = !!currentUser

  // Данные из слайса пульса/ленты
  const { events, status, error } = useSelector((state) => state.feed)

  useEffect(() => {
    dispatch(fetchFeedEvents())

    return () => {
      dispatch(resetFeedState())
    }
  }, [dispatch])

  // Функция-генератор текста и иконок для разных типов активностей
  const renderEventContent = (type, meta) => {
    switch (type) {
      case 'RANK_UP':
        return {
          icon: '🎙️',
          text: (
            <>
              взял новый ораторский ранг:{' '}
              <span className={styles.highlight_rank}>
                {meta?.newRank || 'Спикер'}
              </span>
              !
            </>
          ),
        }
      case 'CHALLENGE_DONE':
        return {
          icon: '🔥',
          text: (
            <>
              успешно выполнил боевой челлендж{' '}
              <span className={styles.highlight_challenge}>
                «{meta?.eventTargetName}»
              </span>
              !
            </>
          ),
        }
      case 'COURSE_STARTED':
        return {
          icon: '🚀',
          text: (
            <>
              принял вызов и начал прохождение курса{' '}
              <span className={styles.highlight_rank}>
                «{meta?.eventTargetName}»
              </span>
              ! Удачи в обучении!
            </>
          ),
        }
      case 'COURSE_COMPLETED':
        return {
          icon: '📜',
          text: (
            <>
              полностью прошел курс{' '}
              <span className={styles.highlight_challenge}>
                «{meta?.eventTargetName}»
              </span>{' '}
              и перевел навыки оратора на новый уровень!
            </>
          ),
        }
      case 'SHOP_PURCHASE':
        return {
          icon: '💰',
          text: (
            <>
              приобрел {' '}
              <span className={styles.highlight_premium}>
                «{meta?.eventTargetName}»
              </span>{' '}
              в магазине оратора! Качаем стиль вместе с речью!
            </>
          ),
        }
      case 'PREMIUM_BUY':
        return {
          icon: '👑',
          text: (
            <span className={styles.highlight_premium}>
              активировал Premium-статус и открыл ИИ-тренажеры!
            </span>
          ),
        }
      case 'STREAK_WEEK':
        return {
          icon: '⚡',
          text: (
            <>
              занимается в тренажерах уже{' '}
              <span className={styles.highlight_streak}>
                {meta?.streakDays || 7} дней подряд
              </span>
              ! Ударный темп!
            </>
          ),
        }
      case 'EXERCISE_TOP_SCORE':
        return {
          icon: '🎯',
          text: (
            <>
              показал блестящий результат в тренажере{' '}
              <span className={styles.highlight_rank}>
                «{meta?.exerciseTitle}»
              </span>
              , набрав{' '}
              <span className={styles.highlight_score}>
                {meta?.score} из 100 баллов
              </span>{' '}
              от ИИ!
            </>
          ),
        }

      case 'EXERCISE_MILESTONE':
        return {
          icon: '🏆',
          text: (
            <>
              проявил похвальное упорство и завершил тренажер{' '}
              <span className={styles.highlight_challenge}>
                «{meta?.exerciseTitle}»
              </span>{' '}
              уже в{' '}
              <span className={styles.highlight_streak}>
                {meta?.completionsCount}-й раз
              </span>
              !
            </>
          ),
        }
      case 'ACHIEVEMENT_UNLOCKED':
        return {
          icon: '🏅',
          text: (
            <>
              заслужил почетное достижение:{' '}
              <span className={styles.highlight_premium}>
                «{meta?.eventTargetName}»
              </span>
              ! Легендарно!
            </>
          ),
        }
      default:
        return {
          icon: '📢',
          text: 'проявляет активность в приложении Govorix',
        }
    }
  }

  const handleCongratulate = async (eventId) => {
    if (!isAuthenticated) {
      message.warning(
        'Войдите в аккаунт, чтобы поддерживать успехи других ораторов!',
      )
      return
    }

    try {
      await dispatch(fetchSendCongratulation(eventId)).unwrap()
    } catch (err) {
      message.error(err || 'Не удалось отправить реакцию')
    }
  }

  if (status === 'loading') {
    return (
      <div className={styles.feed_loader}>
        Слушаем пульс сообщества...
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.feed_error}>
        {error || 'Ошибка загрузки активности'}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className={styles.feed_empty}>
        Пока здесь тихо. Стань первым, кто совершит прорыв сегодня!
      </div>
    )
  }

  return (
    <div className={styles.feed_container}>
      {events.map((event) => {
        const { icon, text } = renderEventContent(
          event.type,
          event.meta,
        )
        const isPremiumAuthor = event.author?.isPremium

        return (
          <div key={event.id} className={styles.feed_item}>
            {/* Аватар с золотым ободком для премиум-пользователей */}
            <div
              className={`${styles.avatar_wrapper} ${isPremiumAuthor ? styles.avatar_premium : ''}`}
            >
              {event.author?.avatar ? (
                <img
                  src={event.author.avatar}
                  alt="avatar"
                  className={styles.avatar_img}
                />
              ) : (
                <div className={styles.avatar_placeholder}>👤</div>
              )}
            </div>

            {/* Контентная зона события */}
            <div className={styles.content_zone}>
              <div className={styles.text_line}>
                <strong className={styles.author_name}>
                  {event.author?.displayName}
                </strong>{' '}
                <span className={styles.event_icon}>{icon}</span>{' '}
                {text}
              </div>
              <span className={styles.time_label}>
                {new Date(event.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            {/* Социальная кнопка "Огонек" */}
            <button
              className={`${styles.fire_btn} ${event.isCongratulatedByMe ? styles.fire_btn_active : ''}`}
              onClick={() => handleCongratulate(event.id)}
              disabled={event.isCongratulatedByMe}
              title={
                event.isCongratulatedByMe
                  ? 'Вы уже поддержали'
                  : 'Зажечь огонь поддержки!'
              }
            >
              <span className={styles.fire_emoji}>🔥</span>
              {event.congratulationsCount > 0 && (
                <span className={styles.fire_count}>
                  {event.congratulationsCount}
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default FeedList
