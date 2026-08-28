import React from 'react'
import AvatarOrPlaceholder from '../../../../components/avatar-or-placeholder/AvatarOrPlaceholder'
import styles from './ProfileCard.module.css'

const ProfileCard = ({ user }) => {
  return (
    <div className={styles.gamification_card}>
      <div className={styles.avatar_wrapper}>
        <AvatarOrPlaceholder user={user} size_class="size_m" />
      </div>
      
      <div className={styles.gamer_info}>
        <h4 className={styles.display_name}>Оратор {user?.displayName || 'Anonimus'}</h4>
        <span className={styles.level_badge}>Уровень {user?.progression?.level || 1}</span>
      </div>
    </div>
  )
}

export default ProfileCard
