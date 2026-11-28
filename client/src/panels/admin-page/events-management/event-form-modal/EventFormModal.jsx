import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { TbX, TbHelp } from 'react-icons/tb'

import {
  fetchCreateEvent,
  fetchUpdateEvent,
  fetchGetEventsList,
} from '../../../../redux/slices/educationHubSlice'
import MarkdownHelpModal from '../../../../components/modal/markdown-help-modal/MarkdownHelpModal'

import styles from './EventFormModal.module.css'

const EMPTY_EVENT_FORM = {
  title: '',
  description: '',
  coverImage: '',
  format: 'online',
  city: '',
  secretLocationOrLink: '',
  startDate: '',
  durationMinutes: 90,
  maxSeats: 20,
  priceRub: 0,
  isPublished: true,
}

const toDateTimeLocalValue = (isoString) => {
  if (!isoString) return ''
  const d = new Date(isoString)
  const offsetMs = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16)
}

const EventFormModal = ({ isOpen, onClose, initialEvent = null }) => {
  const dispatch = useDispatch()
  const { isSubmitting } = useSelector((state) => state.educationHub)

  const [formData, setFormData] = useState(EMPTY_EVENT_FORM)
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  // Заполняем форму при открытии
  useEffect(() => {
    if (!isOpen) return

    if (initialEvent) {
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        coverImage: initialEvent.coverImage || '',
        format: initialEvent.format || 'online',
        city: initialEvent.city || '',
        secretLocationOrLink: initialEvent.secretLocationOrLink || '',
        startDate: toDateTimeLocalValue(initialEvent.startDate),
        durationMinutes: initialEvent.durationMinutes || 90,
        maxSeats: initialEvent.maxSeats || 20,
        priceRub: initialEvent.priceRub || 0,
        isPublished:
          initialEvent.isPublished !== undefined
            ? initialEvent.isPublished
            : true,
      })
    } else {
      setFormData(EMPTY_EVENT_FORM)
    }
  }, [isOpen, initialEvent])

  // Блокировка скролла фона и закрытие по Escape
  useEffect(() => {
    if (!isOpen) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isHelpOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, isHelpOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !formData.title.trim() ||
      !formData.description.trim() ||
      !formData.secretLocationOrLink.trim() ||
      !formData.startDate
    ) {
      message.warning('Заполните все обязательные поля со звездочкой (*)')
      return
    }

    if (formData.format === 'offline' && !formData.city.trim()) {
      message.warning('Укажите город для офлайн-мероприятия')
      return
    }

    try {
      const payload = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        durationMinutes: Number(formData.durationMinutes),
        maxSeats: Number(formData.maxSeats),
        priceRub: Number(formData.priceRub),
      }

      if (initialEvent?._id) {
        await dispatch(
          fetchUpdateEvent({ id: initialEvent._id, payload })
        ).unwrap()
        message.success('Мероприятие обновлено')
      } else {
        await dispatch(fetchCreateEvent(payload)).unwrap()
        message.success('Мероприятие создано')
      }

      dispatch(fetchGetEventsList({ includeDrafts: 'true' }))
      onClose()
    } catch (err) {
      message.error(err || 'Ошибка при сохранении мероприятия')
    }
  }
  return (
    <>
      <div className={styles.modal_overlay} onClick={onClose}>
        <div
          className={styles.modal_content}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modal_header}>
            <h3 className={styles.modal_title}>
              {initialEvent
                ? 'Редактировать мероприятие'
                : 'Новое мероприятие'}
            </h3>
            <button
              type="button"
              className={styles.close_icon_btn}
              onClick={onClose}
              aria-label="Закрыть окно"
            >
              <TbX size={20} />
            </button>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field_group}>
              <label className={styles.label}>Формат проведения *</label>
              <div className={styles.radio_row}>
                <button
                  type="button"
                  className={`${styles.radio_btn} ${
                    formData.format === 'online' ? styles.radio_btn_active : ''
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, format: 'online', city: '' })
                  }
                >
                  Онлайн (Zoom / Телемост)
                </button>
                <button
                  type="button"
                  className={`${styles.radio_btn} ${
                    formData.format === 'offline' ? styles.radio_btn_active : ''
                  }`}
                  onClick={() =>
                    setFormData({ ...formData, format: 'offline' })
                  }
                >
                  Офлайн (Живая встреча)
                </button>
              </div>
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>Название мероприятия *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Например: Ораторский клуб: Спарринг дебатов"
                required
              />
            </div>

            {formData.format === 'offline' && (
              <div className={styles.field_group}>
                <label className={styles.label}>Город *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Например: Санкт-Петербург"
                  required
                />
              </div>
            )}

            <div className={styles.field_group}>
              <label className={styles.label}>
                {formData.format === 'offline'
                  ? 'Точный адрес площадки (откроется после оплаты) *'
                  : 'Ссылка на чат или созвон (откроется после оплаты) *'}
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.secretLocationOrLink}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    secretLocationOrLink: e.target.value,
                  })
                }
                placeholder={
                  formData.format === 'offline'
                    ? 'Невский пр., 100, лофт «Сцена», зал 2'
                    : 'https://t.me+... или https://yandex.ru...'
                }
                required
              />
            </div>

            <div className={styles.two_cols}>
              <div className={styles.field_group}>
                <label className={styles.label}>Дата и время старта *</label>
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field_group}>
                <label className={styles.label}>Длительность (минут)</label>
                <input
                  type="number"
                  min="15"
                  className={styles.input}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className={styles.two_cols}>
              <div className={styles.field_group}>
                <label className={styles.label}>Максимум мест *</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  value={formData.maxSeats}
                  onChange={(e) =>
                    setFormData({ ...formData, maxSeats: e.target.value })
                  }
                  required
                />
              </div>

              <div className={styles.field_group}>
                <label className={styles.label}>
                  Цена билета (₽, 0 = бесплатно)
                </label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  value={formData.priceRub}
                  onChange={(e) =>
                    setFormData({ ...formData, priceRub: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className={styles.field_group}>
              <label className={styles.label}>
                Ссылка на обложку (необязательно)
              </label>
              <input
                type="text"
                className={styles.input}
                value={formData.coverImage}
                onChange={(e) =>
                  setFormData({ ...formData, coverImage: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className={styles.field_group}>
              <div className={styles.label_with_help}>
                <label className={styles.label}>
                  Описание и программа (Markdown) *
                </label>
                <button
                  type="button"
                  className={styles.help_trigger_btn}
                  onClick={() => setIsHelpOpen(true)}
                  title="Справка по Markdown-разметке"
                >
                  <TbHelp size={15} />
                  <span>Разметка</span>
                </button>
              </div>

              <textarea
                className={styles.textarea}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Расскажите, что ждет участников..."
                required
              />
            </div>

            <label className={styles.checkbox_row}>
              <input
                type="checkbox"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData({ ...formData, isPublished: e.target.checked })
                }
              />
              <span>Опубликовано в афише</span>
            </label>

            <button
              type="submit"
              className={styles.submit_btn}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Сохраняем...'
                : initialEvent
                ? 'Сохранить изменения'
                : 'Опубликовать мероприятие'}
            </button>
          </form>
        </div>
      </div>

      <MarkdownHelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </>
  )
}

export default EventFormModal
