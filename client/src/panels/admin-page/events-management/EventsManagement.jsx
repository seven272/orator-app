import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message, Popconfirm, Spin } from 'antd'
import {
  TbPlus,
  TbEdit,
  TbTrash,
  TbUsers,
  TbMapPin,
  TbVideo,
} from 'react-icons/tb'

import {
  fetchGetEventsList,
  fetchGetEventById,
  fetchDeleteEvent,
  fetchGetEventParticipants,
  clearEventParticipants,
} from '../../../redux/slices/educationHubSlice'

import EventFormModal from './event-form-modal/EventFormModal'
import EventParticipantsModal from './event-participants-modal/EventParticipantsModal'

import styles from './EventsManagement.module.css'

const EventsManagement = () => {
  const dispatch = useDispatch()
  const { events, eventParticipantsData, isLoadingList } = useSelector(
    (state) => state.educationHub
  )

  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)

  useEffect(() => {
    dispatch(fetchGetEventsList({ includeDrafts: 'true' }))
  }, [dispatch])

  const openCreateModal = () => {
    setEditingEvent(null)
    setIsFormModalOpen(true)
  }

  const openEditModal = async (eventItem) => {
    try {
      const fullEvent = await dispatch(
        fetchGetEventById(eventItem._id)
      ).unwrap()
      setEditingEvent(fullEvent)
      setIsFormModalOpen(true)
    } catch (err) {
      message.error('Не удалось загрузить данные мероприятия')
    }
  }

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false)
    setEditingEvent(null)
  }

  const openParticipantsModal = async (eventId) => {
    try {
      await dispatch(fetchGetEventParticipants(eventId)).unwrap()
      setIsParticipantsModalOpen(true)
    } catch (err) {
      message.error(err || 'Не удалось загрузить список участников')
    }
  }

  const handleCloseParticipantsModal = () => {
    setIsParticipantsModalOpen(false)
    dispatch(clearEventParticipants())
  }

  const handleDelete = async (id) => {
    try {
      await dispatch(fetchDeleteEvent(id)).unwrap()
      message.success('Мероприятие удалено')
    } catch (err) {
      message.error(err || 'Не удалось удалить мероприятие')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.top_bar}>
        <h2 className={styles.section_title}>Мероприятия ({events.length})</h2>
        <button
          type="button"
          className={styles.add_btn}
          onClick={openCreateModal}
        >
          <TbPlus size={18} />
          <span>Создать событие</span>
        </button>
      </div>

      {isLoadingList ? (
        <div className={styles.loader_box}>
          <Spin />
        </div>
      ) : (
        <div className={styles.items_list}>
          {events.map((ev) => {
            const takenSeats = ev.maxSeats - ev.availableSeats
            const dateLabel = new Date(ev.startDate).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={ev._id} className={styles.item_row}>
                <div className={styles.item_info}>
                  <div className={styles.badges_row}>
                    <span
                      className={`${styles.format_badge} ${
                        ev.format === 'offline'
                          ? styles.badge_offline
                          : styles.badge_online
                      }`}
                    >
                      {ev.format === 'offline' ? (
                        <>
                          <TbMapPin size={12} /> {ev.city}
                        </>
                      ) : (
                        <>
                          <TbVideo size={12} /> Онлайн
                        </>
                      )}
                    </span>

                    <span className={styles.price_badge}>
                      {ev.priceRub === 0 ? 'Бесплатно' : `${ev.priceRub} ₽`}
                    </span>

                    {!ev.isPublished && (
                      <span className={styles.draft_badge}>Скрыто</span>
                    )}
                  </div>

                  <div className={styles.item_title}>{ev.title}</div>
                  <div className={styles.item_meta}>
                    {dateLabel} · Мест занято: {takenSeats}/{ev.maxSeats}
                  </div>
                </div>

                <div className={styles.actions_col}>
                  <button
                    type="button"
                    className={styles.icon_btn}
                    onClick={() => openParticipantsModal(ev._id)}
                    title="Список участников"
                  >
                    <TbUsers size={18} />
                  </button>

                  <button
                    type="button"
                    className={styles.icon_btn}
                    onClick={() => openEditModal(ev)}
                    title="Редактировать"
                  >
                    <TbEdit size={18} />
                  </button>

                  <Popconfirm
                    title="Удалить мероприятие?"
                    description="Если есть участники, лучше скрыть событие."
                    onConfirm={() => handleDelete(ev._id)}
                    okText="Да"
                    cancelText="Нет"
                  >
                    <button
                      type="button"
                      className={`${styles.icon_btn} ${styles.delete_btn}`}
                      title="Удалить"
                    >
                      <TbTrash size={18} />
                    </button>
                  </Popconfirm>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        initialEvent={editingEvent}
      />

      <EventParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={handleCloseParticipantsModal}
        participantsData={eventParticipantsData}
      />
    </div>
  )
}

export default EventsManagement
