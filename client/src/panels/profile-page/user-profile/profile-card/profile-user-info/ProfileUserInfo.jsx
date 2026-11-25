import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import AvatarOrPlaceholder from '../../../../../components/avatar-or-placeholder/AvatarOrPlaceholder'
import { openPremiumModal } from '../../../../../redux/slices/profileSlice'
import UserRankBadge from './user-rank-badge/UserRankBadge'
import styles from './ProfileUserInfo.module.css'

const ProfileUserInfo = ({ user, isPremium, premiumExpiresAt }) => {
  const dispatch = useDispatch()
  const [isPremiumLoading, setIsPremiumLoading] = useState(false)

  const handleOpenPayment = () => {
    dispatch(openPremiumModal())
  }

  return (
    <div className={styles.top_profile_row}>
      <div className={styles.avatar_wrapper}>
        <AvatarOrPlaceholder user={user} size_class="size_m" />
      </div>

      <div className={styles.gamer_info}>
        <h4 className={styles.display_name}>
          {user?.displayName || 'Anonimus'}
        </h4>

        <UserRankBadge rankIndex={user?.progression?.speakerRank ?? 0} />

        <div className={styles.premium_status_row}>
          <span className={styles.status_label}>Премиум-статус: </span>
          {isPremium ? (
            <span className={styles.status_value_active}>
              активен{' '}
              {premiumExpiresAt &&
                `(до ${new Date(premiumExpiresAt).toLocaleDateString('ru-RU')})`}
            </span>
          ) : (
            <span className={styles.status_value_inactive}>не активен</span>
          )}
        </div>
      </div>

      <div className={styles.premium_action_block}>
        {isPremium ? (
          <div className={styles.premium_badge_active}>
            <span>PREMIUM АКТИВЕН</span>
            <span className={styles.crown_icon}>👑</span>
          </div>
        ) : (
          <button
            type="button"
            className={styles.premium_buy_btn}
            onClick={handleOpenPayment}
            disabled={isPremiumLoading}
          >
            {isPremiumLoading ? 'Секунду...' : 'Подключить Premium'}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProfileUserInfo
