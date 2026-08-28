import React from 'react'

import styles from './SlotCard.module.css'
import BaseSlotCard from './BaseSlotCard'

const AcceptedSlotCard = ({ room, isMyOwnSlot, currentUserId }) => {
  const isIAmPlayerB =
    room.userB?._id === currentUserId || room.userB === currentUserId

  const headerContent = (
    <div className={styles.participants_container}>
      {/* Игрок А (Организатор) */}
      <div className={styles.user_profile_meta}>
        {room.userA?.avatar && (
          <img
            src={room.userA.avatar}
            alt={room.userA.displayName}
            className={styles.avatar_mini}
          />
        )}
        <span className={styles.slot_user}>
          🗣️{' '}
          {isMyOwnSlot
            ? 'Вы (Организатор)'
            : `Орг: ${room.userA?.displayName || 'Пользователь'}`}
        </span>
      </div>

      {/* Игрок Б (Оппонент) */}
      {room.userB && (
        <div className={styles.user_profile_meta}>
          {room.userB?.avatar && (
            <img
              src={room.userB.avatar}
              alt={room.userB.displayName}
              className={styles.avatar_mini}
            />
          )}
          <span className={styles.slot_user}>
            ⚔️{' '}
            {isIAmPlayerB
              ? 'Вы (Оппонент)'
              : `Опп: ${room.userB?.displayName || 'Пользователь'}`}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <BaseSlotCard
      room={room}
      cardModifierClass={styles.slot_card_accepted}
      headerMetaContent={headerContent}
      badgeComponent={
        <>
          {isMyOwnSlot && (
            <span className={styles.badge_own}>⭐️ Мой слот</span>
          )}
          <span className={styles.badge_accepted}>
            🤝 Вызов принят
          </span>
        </>
      }
    >
      <div className={styles.status_text_accepted}>
        {isMyOwnSlot
          ? 'Оппонент найден! Ссылка на звонок появится в назначенное время.'
          : 'Пара укомплектована.'}
      </div>
    </BaseSlotCard>
  )
}

export default AcceptedSlotCard
