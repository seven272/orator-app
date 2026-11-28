import React, { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Spin, Empty } from 'antd'
import { TbTicket } from 'react-icons/tb'

import {
  fetchGetEventsList,
  setEventFilters,
} from '../../redux/slices/educationHubSlice'
import { checkIsAuth } from '../../redux/slices/authSlice'
import { isEventPast } from '../../utils/dateFormatters'
import EventCard from './event-card/EventCard'

import styles from './EventsPage.module.css'

const FORMAT_FILTERS = [
  { key: 'all', label: 'Все' },
  { key: 'online', label: 'Онлайн' },
  { key: 'offline', label: 'Офлайн' },
]

const EventsPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const isAuth = useSelector(checkIsAuth)
  const { events, eventFilters, isLoadingList } = useSelector(
    (state) => state.educationHub
  )

  // Накопительный список городов, чтобы они не пропадали при фильтрации по одному городу
  const [knownCities, setKnownCities] = useState([])

  useEffect(() => {
    const params = {}
    if (eventFilters.format !== 'all') {
      params.format = eventFilters.format
    }
    if (eventFilters.city) {
      params.city = eventFilters.city
    }
    if (eventFilters.onlyMy && isAuth) {
      params.onlyMy = 'true'
    }

    dispatch(fetchGetEventsList(params))
  }, [
    dispatch,
    eventFilters.format,
    eventFilters.city,
    eventFilters.onlyMy,
    isAuth,
  ])

  // Пополняем справочник городов при получении событий
  useEffect(() => {
    if (!events.length) return
    setKnownCities((prev) => {
      const merged = new Set(prev)
      events.forEach((ev) => {
        if (ev.format === 'offline' && ev.city) {
          merged.add(ev.city.trim())
        }
      })
      return Array.from(merged)
    })
  }, [events])

  // Разделяем события на предстоящие и прошедшие
  const { upcomingEvents, pastEvents } = useMemo(() => {
    const upcoming = []
    const past = []

    events.forEach((ev) => {
      if (isEventPast(ev.startDate, ev.durationMinutes)) {
        past.push(ev)
      } else {
        upcoming.push(ev)
      }
    })

    // Прошедшие сортируем от недавних к более старым
    past.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

    return { upcomingEvents: upcoming, pastEvents: past }
  }, [events])

  const handleFormatChange = (formatKey) => {
    const nextFilters = { format: formatKey }
    if (formatKey === 'online') {
      nextFilters.city = ''
    }
    dispatch(setEventFilters(nextFilters))
  }

  const handleCityChange = (cityName) => {
    const nextCity = eventFilters.city === cityName ? '' : cityName
    dispatch(setEventFilters({ city: nextCity }))
  }

  const handleToggleOnlyMy = () => {
    dispatch(setEventFilters({ onlyMy: !eventFilters.onlyMy }))
  }

  const handleOpenEvent = (eventId) => {
    navigate(`/hub/events/${eventId}`)
  }

  return (
    <div className={styles.events_page}>
      {/* Панель фильтров: Формат + Мои билеты */}
      <div className={styles.top_filters_row}>
        <div className={styles.format_pills}>
          {FORMAT_FILTERS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.format_pill} ${
                eventFilters.format === tab.key ? styles.format_pill_active : ''
              }`}
              onClick={() => handleFormatChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isAuth && (
          <button
            type="button"
            className={`${styles.my_tickets_btn} ${
              eventFilters.onlyMy ? styles.my_tickets_btn_active : ''
            }`}
            onClick={handleToggleOnlyMy}
          >
            <TbTicket size={15} />
            <span>Мои билеты</span>
          </button>
        )}
      </div>

      {/* Чипсы городов */}
      {eventFilters.format !== 'online' &&
        (knownCities.length > 0 || eventFilters.city) && (
          <div className={styles.cities_scroll_row}>
            <button
              type="button"
              className={`${styles.city_chip} ${
                !eventFilters.city ? styles.city_chip_active : ''
              }`}
              onClick={() => handleCityChange('')}
            >
              Все города
            </button>

            {knownCities.map((cityName) => (
              <button
                key={cityName}
                type="button"
                className={`${styles.city_chip} ${
                  eventFilters.city === cityName ? styles.city_chip_active : ''
                }`}
                onClick={() => handleCityChange(cityName)}
              >
                {cityName}
              </button>
            ))}
          </div>
        )}

      {/* Контент */}
      {isLoadingList ? (
        <div className={styles.loader_box}>
          <Spin size="large" />
        </div>
      ) : events.length === 0 ? (
        <div className={styles.empty_box}>
          <Empty
            description={
              eventFilters.onlyMy
                ? 'У вас пока нет оформленных билетов на мероприятия'
                : 'Мероприятий по выбранным фильтрам пока нет'
            }
          />
        </div>
      ) : (
        <div className={styles.sections_wrap}>
          {upcomingEvents.length > 0 && (
            <div className={styles.events_list}>
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event._id}
                  event={event}
                  onSelect={handleOpenEvent}
                />
              ))}
            </div>
          )}

          {pastEvents.length > 0 && (
            <section className={styles.past_section}>
              <h2 className={styles.past_section_title}>
                Прошедшие мероприятия
              </h2>
              <div className={styles.events_list}>
                {pastEvents.map((event) => (
                  <EventCard
                    key={event._id}
                    event={event}
                    onSelect={handleOpenEvent}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default EventsPage
