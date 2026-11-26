/* eslint-disable react/prop-types */
import React from 'react'
import styles from './XpRequirementCard.module.css'

const XpRequirementCard = ({ userXp = 0, xpReq }) => {
  if (!xpReq) return null

  return (
    <div
      className={`${styles.req_card} ${xpReq.isDone ? styles.card_done : ''}`}
    >
      <div className={styles.card_top}>
        <span className={styles.card_badge}>1. Опыт оратора</span>
        <span className={styles.card_icon}>{xpReq.isDone ? '✅' : '⏳'}</span>
      </div>

      <div className={styles.xp_numbers}>
        <strong>{userXp.toLocaleString()}</strong> /{' '}
        {xpReq.required.toLocaleString()} XP
      </div>

      <div className={styles.mini_track}>
        <div
          className={styles.mini_fill}
          style={{ width: `${xpReq.percent}%` }}
        />
      </div>
    </div>
  )
}

export default XpRequirementCard
