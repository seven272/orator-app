import React, { useEffect } from 'react'
import { message } from 'antd'
import { TbX, TbCopy } from 'react-icons/tb'

import styles from './EventParticipantsModal.module.css'

const EventParticipantsModal = ({ isOpen, onClose, participantsData }) => {
  useEffect(() => {
    if (!isOpen) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalStyle
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !participantsData) return null

  const participants = participantsData.participants || []

  const handleCopyAllList = () => {
    if (!participants.length) return
    const textList = participants
      .map((p, idx) => {
        const u = p.userId || {}
        const name =
          u.displayName ||
          `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
          'Пользователь'
        const contact = u.email || (u.vkId ? `://vk.com{u.vkId}` : '—')
        return `${idx + 1}. ${name} (${contact})`
      })
      .join('\n')

    navigator.clipboard.writeText(textList)
    message.success('Список участников скопирован')
  }

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modal_header}>
          <div className={styles.title_col}>
            <h3 className={styles.modal_title}>
              Участники ({participants.length})
            </h3>
            <span className={styles.event_subtitle}>
              {participantsData.eventTitle}
            </span>
          </div>

          <div className={styles.header_actions}>
            {participants.length > 0 && (
              <button
                type="button"
                className={styles.copy_all_btn}
                onClick={handleCopyAllList}
                title="Скопировать список"
              >
                <TbCopy size={16} />
                <span>Список</span>
              </button>
            )}

            <button
              type="button"
              className={styles.close_icon_btn}
              onClick={onClose}
              aria-label="Закрыть окно"
            >
              <TbX size={20} />
            </button>
          </div>
        </div>

        {participants.length === 0 ? (
          <p className={styles.empty_participants}>
            Пока никто не оформил билет на это мероприятие.
          </p>
        ) : (
          <div className={styles.participants_list}>
            {participants.map((p, idx) => {
              const u = p.userId || {}
              const fullName =
                u.displayName ||
                `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
                'Пользователь'
              const contact =
                u.email || (u.vkId ? `://vk.com{u.vkId}` : 'Без контакта')

              return (
                <div key={p._id || idx} className={styles.participant_row}>
                  <div>
                    <div className={styles.participant_name}>
                      {idx + 1}. {fullName}
                    </div>
                    <div className={styles.participant_contact}>{contact}</div>
                  </div>
                  <span className={styles.participant_date}>
                    {new Date(p.registeredAt).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          className={styles.close_modal_btn}
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default EventParticipantsModal
