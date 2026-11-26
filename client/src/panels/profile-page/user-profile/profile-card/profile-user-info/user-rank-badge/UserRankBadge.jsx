/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RANKS } from '../../../../../../constants/ranks'
import styles from './UserRankBadge.module.css'

const UserRankBadge = ({ rankIndex = 0 }) => {
  const navigate = useNavigate()
  const popoverRef = useRef(null)

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { speakerProgress } = useSelector((state) => state.rank)

  const safeIndex = Number.isInteger(rankIndex) ? rankIndex : 0
  const currentStage = RANKS.find((r) => r.rankIndex === safeIndex) || RANKS

  const nextStage =
    speakerProgress?.nextRankIndex !== null &&
    speakerProgress?.nextRankIndex !== undefined
      ? RANKS.find((r) => r.rankIndex === speakerProgress.nextRankIndex)
      : null

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
        <img
          src={currentStage.icon}
          alt={currentStage.title}
          className={styles.trigger_png}
        />
        <span>Ранг: {currentStage.title}</span>
        <span className={styles.badge_arrow}>
          {isDropdownOpen ? '▲' : '▼'}
        </span>
      </button>

      {isDropdownOpen && (
        <div className={styles.rank_popover}>
          <div className={styles.popover_header}>Лестница оратора</div>

          <div className={styles.popover_list}>
            {RANKS.map((stage) => {
              const isCurrent = stage.rankIndex === safeIndex
              const isPassed = stage.rankIndex < safeIndex

              return (
                <div
                  key={stage.rankIndex}
                  className={`${styles.popover_row} ${isCurrent ? styles.row_current : ''} ${isPassed ? styles.row_passed : ''}`}
                >
                  <div className={styles.row_left}>
                    <img
                      src={stage.icon}
                      alt={stage.title}
                      className={styles.row_png}
                    />
                    <span className={styles.row_title}>{stage.title}</span>
                  </div>
                  <span className={styles.row_status}>
                    {isCurrent
                      ? 'Вы здесь'
                      : isPassed
                        ? '✓'
                        : `🔒 ${stage.minXp / 1000}к XP`}
                  </span>
                </div>
              )
            })}
          </div>

          {speakerProgress && !speakerProgress.isMaxRank && nextStage && (
            <div className={styles.popover_hint}>
              До «{nextStage.title}»:{' '}
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
