import React from 'react'
import { useNavigate } from 'react-router-dom'
import AvatarOrPlaceholder from '../../avatar-or-placeholder/AvatarOrPlaceholder'
import styles from './ProfileWidget.module.css'

const ProfileWidget = ({ profileUser, authUser }) => {
  const navigate = useNavigate()

  return (
    <div className={styles.profile_widget} onClick={() => navigate('/dashboard')}>
      <div className={styles.status_badge}>
        {profileUser?.level && (
          <>
            <span className={`${styles.status_text} ${styles.level_full}`}>
              Lvl {profileUser.level}
            </span>
            <span className={`${styles.status_text} ${styles.level_short}`}>
              Lvl {profileUser.level}
            </span>
          </>
        )}
        
        {profileUser?.level && profileUser?.xp !== undefined && (
          <span className={styles.divider}>|</span>
        )}
        
        {profileUser?.xp !== undefined && (
          <span className={styles.status_text}>
            {profileUser.xp} XP
          </span>
        )}
      </div>

      <AvatarOrPlaceholder
        user={authUser}
        sizeClass="size_s"
        onClick={(e) => {
          e.stopPropagation() // Разделяем клик по виджету и клик по аватару
          navigate('/profile')
        }}
      />
    </div>
  )
}

export default ProfileWidget
