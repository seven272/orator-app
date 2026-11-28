import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { Spin, Result, Button, message } from 'antd'
import {
  TbArrowLeft,
  TbCalendar,
  TbClock,
  TbMapPin,
  TbVideo,
  TbUsers,
  TbCheck,
} from 'react-icons/tb'

import {
  fetchGetEventById,
  fetchRegisterForEvent,
  clearCurrentEvent,
} from '../../redux/slices/educationHubSlice'
import { checkIsAuth, checkIsVkGuest } from '../../redux/slices/authSlice'
import {
  formatEventFullDate,
  formatEventTime,
  isEventPast,
} from '../../utils/dateFormatters'

import EventSecretPass from './event-secret-pass/EventSecretPass'
import EventBookingCard from './event-booking-card/EventBookingCard'

import styles from './EventDetailPage.module.css'

const EventDetailPage = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)
  const { user: authUser } = useSelector((state) => state.auth)

  const { currentEvent, isLoadingDetail, isSubmitting, error } = useSelector(
    (state) => state.educationHub
  )

  useEffect(() => {
    if (id) {
      dispatch(fetchGetEventById(id))
    }
    return () => {
      dispatch(clearCurrentEvent())
    }
  }, [dispatch, id])

  const detectIsVkEnvironment = () => {
    const search = window.location.search || ''
    return (
      search.includes('vk_app_id') ||
      isVkGuest ||
      authUser?.registeredFrom === 'vk'
    )
  }

  const handleRegisterOrPay = async () => {
    if (!isAuth) {
      message.info('Войдите или создайте аккаунт, чтобы оформить билет')
      navigate('/auth')
      return
    }

    try {
      const isVk = detectIsVkEnvironment()
      const res = await dispatch(
        fetchRegisterForEvent({ eventId: currentEvent._id, isVk })
      ).unwrap()

      if (res.isFree) {
        message.success(res.message || 'Вы успешно записаны на мероприятие!')
        dispatch(fetchGetEventById(currentEvent._id))
      } else if (res.confirmationUrl) {
        window.location.assign(res.confirmationUrl)
      }
    } catch (err) {
      message.error(err?.message || 'Не удалось оформить участие')
    }
  }

  if (isLoadingDetail) {
    return (
      <div className={styles.center_box}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !currentEvent) {
    return (
      <div className={styles.center_box}>
        <Result
          status="404"
          title="Мероприятие не найдено"
          subTitle={error || 'Возможно, встреча уже прошла или была отменена.'}
          extra={
            <Button type="primary" onClick={() => navigate('/hub/events')}>
              Вернуться в Афишу
            </Button>
          }
        />
      </div>
    )
  }

  const {
    title,
    description,
    coverImage,
    format,
    city,
    startDate,
    durationMinutes,
    maxSeats,
    availableSeats,
    priceRub,
    isRegistered,
    secretLocationOrLink,
  } = currentEvent

  const isOffline = format === 'offline'
  const isPast = isEventPast(startDate, durationMinutes)
  const isSoldOut = availableSeats <= 0 && !isRegistered

  return (
    <div className={styles.detail_page}>
      <button
        type="button"
        className={styles.back_btn}
        onClick={() => navigate('/hub/events')}
      >
        <TbArrowLeft size={18} />
        <span>Все мероприятия</span>
      </button>

      <article className={styles.event_card}>
        {coverImage && (
          <div className={styles.cover_wrap}>
            <img src={coverImage} alt={title} className={styles.cover_img} />
          </div>
        )}

        <div className={styles.header_badges}>
          <span
            className={`${styles.format_badge} ${
              isOffline ? styles.badge_offline : styles.badge_online
            }`}
          >
            {isOffline ? (
              <>
                <TbMapPin size={15} /> Офлайн · {city}
              </>
            ) : (
              <>
                <TbVideo size={15} /> Онлайн-практикум
              </>
            )}
          </span>

          {isRegistered && (
            <span className={styles.ticket_active_badge}>
              <TbCheck size={15} /> {isPast ? 'Вы участвовали' : 'Билет оформлен'}
            </span>
          )}
        </div>

        <h1 className={styles.event_title}>{title}</h1>

        {/* Сетка ключевых параметров */}
        <div className={styles.info_grid}>
          <div className={styles.info_item}>
            <TbCalendar size={18} className={styles.info_icon} />
            <div>
              <span className={styles.info_label}>Дата</span>
              <span className={styles.info_value}>
                {formatEventFullDate(startDate)}
              </span>
            </div>
          </div>

          <div className={styles.info_item}>
            <TbClock size={18} className={styles.info_icon} />
            <div>
              <span className={styles.info_label}>Начало и длительность</span>
              <span className={styles.info_value}>
                {formatEventTime(startDate)} ({durationMinutes} мин)
              </span>
            </div>
          </div>

          <div className={styles.info_item}>
            <TbUsers size={18} className={styles.info_icon} />
            <div>
              <span className={styles.info_label}>
                {isPast ? 'Участники' : 'Свободные места'}
              </span>
              <span className={styles.info_value}>
                {isPast
                  ? `${maxSeats - availableSeats} из ${maxSeats}`
                  : `${availableSeats} из ${maxSeats}`}
              </span>
            </div>
          </div>
        </div>

        {/* Закрытый пропуск с адресом/ссылкой */}
        {isRegistered && (
          <EventSecretPass
            isOffline={isOffline}
            secretLocationOrLink={secretLocationOrLink}
          />
        )}

        {/* Подробное описание программы в Markdown */}
        {description && (
          <div className={styles.description_body}>
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        )}
      </article>

      {/* Нижняя карточка оформления билета */}
      <EventBookingCard
        priceRub={priceRub}
        isAuth={isAuth}
        isRegistered={isRegistered}
        isPast={isPast}
        isSoldOut={isSoldOut}
        isSubmitting={isSubmitting}
        onNavigateAuth={() => navigate('/auth')}
        onRegisterOrPay={handleRegisterOrPay}
      />
    </div>
  )
}

export default EventDetailPage
