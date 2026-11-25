/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RANKS_MAP } from '../../../../../../constants/ranks'
import styles from './UserRankBadge.module.css'

const RANK_TIERS = [
  { index: 0, mic: '🎙️', xpHint: 'Старт' },
  { index: 1, mic: '🎤', xpHint: '10к XP' },
  { index: 2, mic: '🎧', xpHint: '50к XP' },
  { index: 3, mic: '📻', xpHint: '200к XP' },
  { index: 4, mic: '👑', xpHint: '500к XP' },
]

const UserRankBadge = ({ rankIndex = 0 }) => {
  const navigate = useNavigate()
  const popoverRef = useRef(null)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { speakerProgress } = useSelector((state) => state.rank)

  const safeIndex = Number.isInteger(rankIndex) ? rankIndex : 0
  const userRank = RANKS_MAP[safeIndex] || 'начинающий'
  const currentTier = RANK_TIERS[safeIndex] || RANK_TIERS[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDropdownOpen])

  return (
    <div className={styles.rank_dropdown_wrapper} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className={`${styles.rank_trigger_badge} ${styles[`tier_badge_${safeIndex}`] || ''}`}
      >
        <span>{currentTier.mic}</span>
        <span>Ранг: {userRank}</span>
        <span className={styles.badge_arrow}>
          {isDropdownOpen ? '▲' : '▼'}
        </span>
      </button>

      {isDropdownOpen && (
        <div className={styles.rank_popover}>
          <div className={styles.popover_header}>Лестница оратора</div>

          <div className={styles.popover_list}>
            {RANK_TIERS.map((tier) => {
              const isCurrent = tier.index === safeIndex
              const isPassed = tier.index < safeIndex
              const title = RANKS_MAP[tier.index]

              return (
                <div
                  key={tier.index}
                  className={`${styles.popover_row} ${isCurrent ? styles.row_current : ''} ${isPassed ? styles.row_passed : ''}`}
                >
                  <div className={styles.row_left}>
                    <span className={styles.row_mic}>{tier.mic}</span>
                    <span className={styles.row_title}>{title}</span>
                  </div>
                  <span className={styles.row_status}>
                    {isCurrent
                      ? 'Вы здесь'
                      : isPassed
                        ? '✓'
                        : `🔒 ${tier.xpHint}`}
                  </span>
                </div>
              )
            })}
          </div>

          {speakerProgress && !speakerProgress.isMaxRank && (
            <div className={styles.popover_hint}>
              До «{speakerProgress.nextRank?.title}»:{' '}
              <strong>
                {speakerProgress.completedCount}/{speakerProgress.totalCount}
              </strong>{' '}
              условий
            </div>
          )}

          <button
            type="button"
            className={styles.popover_cta_btn}
            onClick={() => {
              setIsDropdownOpen(false)
              navigate('/dashboard')
            }}
          >
            Открыть карту пути →
          </button>
        </div>
      )}
    </div>
  )
}

export default UserRankBadge
