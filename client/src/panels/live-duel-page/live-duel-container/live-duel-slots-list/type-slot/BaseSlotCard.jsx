import React from 'react'

import styles from './SlotCard.module.css'

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const BaseSlotCard = ({
  room,
  cardModifierClass,
  badgeComponent,
  headerMetaContent, 
  children,
}) => {
  const cardClassName =
    `${styles.slot_card} ${cardModifierClass || ''}`.trim()

  return (
    <div className={cardClassName}>
      <div className={styles.slot_info}>
        <div className={styles.meta_header}>
          {headerMetaContent}
          <div className={styles.badge_container}>
            {badgeComponent}
          </div>
        </div>

        <span className={styles.slot_time}>
          📅 {formatDate(room.scheduledAt)}
        </span>
        <span className={styles.slot_topic}>
          Тема: «{room.topic?.title}»
        </span>
      </div>

      <div className={styles.action_block}>{children}</div>
    </div>
  )
}

export default BaseSlotCard
