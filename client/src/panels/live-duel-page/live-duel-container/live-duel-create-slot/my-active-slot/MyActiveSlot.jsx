import React, { useState } from 'react'

import styles from './MyActiveSlot.module.css'

const MyActiveSlot = ({
  room,
  onDeleteSlot,
  onUpdateSlot
}) => {
 
  const [editingSlotId, setEditingSlotId] = useState(null)
  const [editDate, setEditDate] = useState('')

  const handleStartEdit = (room) => {
    setEditingSlotId(room._id)
    
    // Корректное преобразование локального времени в формат YYYY-MM-DDTHH:mm без смещения UTC
    const d = new Date(room.scheduledAt)
    const localISO = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)

    setEditDate(localISO)
  }

  const handleSaveEdit = (roomId) => {
    if (!editDate) return
    onUpdateSlot(roomId, editDate)
    setEditingSlotId(null)
  }

  return (
    <div className={styles.slot_card}>
      <div className={styles.slot_info}>
        <span className={styles.slot_topic}>
          Тема: «{room.topic?.title}»
        </span>

        {editingSlotId === room._id ? (
          <div className={styles.edit_mode_group}>
            <input
              type="datetime-local"
              value={editDate}
              className={styles.calendar_input_small}
              onChange={(e) => setEditDate(e.target.value)}
            />
            <button
              onClick={() => handleSaveEdit(room._id)}
              className={styles.save_btn}
            >
              💾
            </button>
            <button
              onClick={() => setEditingSlotId(null)}
              className={styles.cancel_btn}
            >
              ❌
            </button>
          </div>
        ) : (
          <span className={styles.slot_time}>
            ⏰{' '}
            {new Date(room.scheduledAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>

      {editingSlotId !== room._id && (
        <div className={styles.slot_actions}>
          <button
            className={styles.edit_btn}
            onClick={() => handleStartEdit(room)}
          >
            ✏️ Редактировать
          </button> 

          <button
            className={styles.delete_btn}
            onClick={() => onDeleteSlot(room._id)}
          >
            🗑️ Удалить
          </button>
        </div>
      )}
    </div>
  )
}

export default MyActiveSlot
