import React from 'react'

import styles from './SlotCard.module.css'
import BaseSlotCard from './BaseSlotCard'

const AvailableSlotCard = ({ room, onBookSlot }) => {
  const headerContent = (
    <div className={styles.user_profile_meta}>
      {room.userA?.avatar && (
        <img
          src={room.userA.avatar}
          alt={room.userA.displayName || 'Оппонент'}
          className={styles.avatar_mini}
        />
      )}
      <span className={styles.slot_user}>
        🗣️ Оппонент: {room.userA?.displayName || 'Пользователь'}
      </span>
    </div>
  )

  return (
    <BaseSlotCard room={room} headerMetaContent={headerContent}>
      <button
        className={styles.book_slot_btn}
        onClick={() => onBookSlot(room._id)}
      >
        Принять вызов
      </button>
    </BaseSlotCard>
  )
}

export default AvailableSlotCard
