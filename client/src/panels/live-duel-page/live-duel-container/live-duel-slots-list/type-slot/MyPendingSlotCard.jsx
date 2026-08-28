import React from 'react'

import styles from './SlotCard.module.css'
import BaseSlotCard from './BaseSlotCard'

const MyPendingSlotCard = ({ room }) => {
  const headerContent = (
    <div className={styles.user_profile_meta}>
      {room.userA?.avatar && (
        <img
          src={room.userA.avatar}
          alt={room.userA.displayName || 'Вы'}
          className={styles.avatar_mini}
        />
      )}
      <span className={styles.slot_user}>🗣️ Вы (Организатор)</span>
    </div>
  )

  return (
    <BaseSlotCard
      room={room}
      cardModifierClass={styles.slot_card_own}
      badgeComponent={
        <span className={styles.badge_own}>⭐️ Мой слот</span>
      }
      headerMetaContent={headerContent}
    >
      <div className={styles.status_text_pending}>
        Ожидание оппонента...
      </div>
    </BaseSlotCard>
  )
}

export default MyPendingSlotCard
