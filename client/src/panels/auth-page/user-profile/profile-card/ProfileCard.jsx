import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import AvatarOrPlaceholder from '../../../../components/avatar-or-placeholder/AvatarOrPlaceholder'
import { fetchActivateFakePremium } from '../../../../redux/slices/profileSlice'
import { getSpeakerProgress } from '../../../../utils/progressHelpers'
import styles from './ProfileCard.module.css'

const ProfileCard = ({ user }) => {
  const dispatch = useDispatch()
  
  const profileState = useSelector((state) => state.profile.user)
  const userXp = profileState?.xp || 0
  const isPremium = profileState?.isPremium || false
  const premiumExpiresAt = profileState?.premiumExpiresAt

  const [isPremiumLoading, setIsPremiumLoading] = useState(false)
  const progressData = getSpeakerProgress(userXp)

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
    <div className={styles.gamification_container}>
      
      {/* ВЕРХНЯЯ ЧАСТЬ: Аватар и Инфо-блок */}
      <div className={styles.top_profile_row}>
        <div className={styles.avatar_wrapper}>
          <AvatarOrPlaceholder user={user} size_class="size_m" />
        </div>
        
        <div className={styles.gamer_info}>
          <h4 className={styles.display_name}>
            Оратор: {user?.displayName || 'Anonimus'}
          </h4>
          <span className={styles.level_badge}>Уровень {user?.progression?.level || 1}</span>
          
          {/* Текстовая надпись статуса строго под именем и уровнем */}
          <div className={styles.premium_status_row}>
            <span className={styles.status_label}>Премиум-статус: </span>
            {isPremium ? (
              <span className={styles.status_value_active}>
                активен {premiumExpiresAt && `(до ${new Date(premiumExpiresAt).toLocaleDateString('ru-RU')})`}
              </span>
            ) : (
              <span className={styles.status_value_inactive}>не активен</span>
            )}
          </div>
        </div>

        {/* Правый блок: Кнопка покупки или индикатор с короной */}
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

      <div className={styles.divider_line} />

      {/* НИЖНЯЯ ЧАСТЬ: Микрофон оратора */}
      <div className={styles.mic_progress_block}>
        <div className={styles.mic_header}>
          <div className={styles.mic_icon_box}>
            <span className={styles.dynamic_mic}>{progressData.mic}</span>
          </div>
          <div className={styles.mic_titles}>
            <span className={styles.rank_title}>Ранг: {progressData.title}</span>
            <span className={styles.audience_text}>Аудитория: {progressData.audience}</span>
          </div>
        </div>
        
        <p className={styles.stage_desc}>{progressData.desc}</p>
        
        <div className={styles.xp_wrapper}>
          <div className={styles.xp_labels}>
            <span>{userXp} XP</span>
            <span>{progressData.maxXp === Infinity ? 'MAX' : `${progressData.maxXp} XP`}</span>
          </div>
          <div className={styles.xp_track}>
            <div 
              className={styles.xp_fill} 
              style={{ width: `${progressData.percent}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  )
}

export default ProfileCard
