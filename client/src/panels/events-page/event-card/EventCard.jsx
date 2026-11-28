import React from 'react'
import {
  TbCalendar,
  TbClock,
  TbMapPin,
  TbVideo,
  TbUsers,
  TbCheck,
  TbChevronRight,
} from 'react-icons/tb'

import {
  formatEventShortDate,
  formatEventTime,
  isEventPast,
} from '../../../utils/dateFormatters'

import styles from './EventCard.module.css'

const EventCard = ({ event, onSelect }) => {
  const isOffline = event.format === 'offline'
  const isPast = isEventPast(event.startDate, event.durationMinutes)
  const isSoldOut = event.availableSeats <= 0 && !event.isRegistered

  return (
    <article
      className={`${styles.event_card} ${isPast ? styles.event_card_past : ''}`}
      onClick={() => onSelect(event._id)}
    >
      {event.coverImage && (
        <div className={styles.cover_wrap}>
          <img
            src={event.coverImage}
            alt={event.title}
            className={styles.cover_img}
            loading="lazy"
          />
          <span
            className={`${styles.format_badge} ${
              isOffline ? styles.badge_offline : styles.badge_online
            }`}
          >
            {isOffline ? (
              <>
                <TbMapPin size={14} /> {event.city || 'Офлайн'}
              </>
            ) : (
              <>
                <TbVideo size={14} /> Онлайн
              </>
            )}
          </span>
        </div>
      )}

      <div className={styles.card_content}>
        <div className={styles.datetime_row}>
          {!event.coverImage && (
            <span
              className={`${styles.inline_format_tag} ${
                isOffline ? styles.tag_offline : styles.tag_online
              }`}
            >
              {isOffline ? event.city || 'Офлайн' : 'Онлайн'}
            </span>
          )}

          <span className={styles.date_item}>
            <TbCalendar size={14} />
            {formatEventShortDate(event.startDate)}
          </span>

          <span className={styles.date_item}>
            <TbClock size={14} />
            {formatEventTime(event.startDate)} ({event.durationMinutes} мин)
          </span>
        </div>

        <h3 className={styles.event_title}>{event.title}</h3>

        <div className={styles.card_footer}>
          <div className={styles.seats_info}>
            <TbUsers size={15} />
            <span>
              {isPast
                ? `Участников: ${event.maxSeats - event.availableSeats}`
                : isSoldOut
                ? 'Мест нет'
                : `Осталось мест: ${event.availableSeats} из ${event.maxSeats}`}
            </span>
          </div>

          <div className={styles.price_action_box}>
            {event.isRegistered ? (
              <span className={styles.registered_badge}>
                <TbCheck size={15} /> {isPast ? 'Вы были' : 'Вы идете'}
              </span>
            ) : isPast ? (
              <span className={styles.soldout_badge}>Завершено</span>
            ) : isSoldOut ? (
              <span className={styles.soldout_badge}>Sold Out</span>
            ) : (
              <span className={styles.price_tag}>
                {event.priceRub === 0 ? 'Бесплатно' : `${event.priceRub} ₽`}
              </span>
            )}

            <TbChevronRight size={18} className={styles.arrow_icon} />
          </div>
        </div>
      </div>
    </article>
  )
}

export default EventCard
