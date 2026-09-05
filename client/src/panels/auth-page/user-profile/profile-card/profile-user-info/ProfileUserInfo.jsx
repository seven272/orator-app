import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import AvatarOrPlaceholder from '../../../../../components/avatar-or-placeholder/AvatarOrPlaceholder'
import { fetchActivateFakePremium } from '../../../../../redux/slices/profileSlice'
import styles from './ProfileUserInfo.module.css' // Используем общий файл стилей

const ProfileUserInfo = ({ user, isPremium, premiumExpiresAt }) => {
  const dispatch = useDispatch()
  const [isPremiumLoading, setIsPremiumLoading] = useState(false)

  const handleBuyPremium = async () => {
    setIsPremiumLoading(true)
    try {
      await dispatch(fetchActivateFakePremium()).unwrap()
      message.success('Премиум-статус успешно активирован!')
    } catch (err) {
      message.error(err || 'Не удалось активировать Премиум')
    } finally {
      setIsPremiumLoading(false)
    }
  }

  return (
    <div className={styles.top_profile_row}>
      <div className={styles.avatar_wrapper}>
        <AvatarOrPlaceholder user={user} size_class="size_m" />
      </div>

      <div className={styles.gamer_info}>
        <h4 className={styles.display_name}>
          Оратор {user?.displayName || 'Anonimus'}
        </h4>
        <span className={styles.level_badge}>
          Уровень {user?.progression?.level || 1}
        </span>

        <div className={styles.premium_status_row}>
          <span className={styles.status_label}>
            Премиум-статус:{' '}
          </span>
          {isPremium ? (
            <span className={styles.status_value_active}>
              активен{' '}
              {premiumExpiresAt &&
                `(до ${new Date(premiumExpiresAt).toLocaleDateString('ru-RU')})`}
            </span>
          ) : (
            <span className={styles.status_value_inactive}>
              не активен
            </span>
          )}
        </div>
      </div>

      <div className={styles.premium_action_block}>
        {isPremium ? (
          <div className={styles.premium_badge_active}>
            <span>ПРЕМИУМ</span>
            <span className={styles.crown_icon}>👑</span>
          </div>
        ) : (
          <button
            type="button"
            className={styles.premium_buy_btn}
            onClick={handleBuyPremium}
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
