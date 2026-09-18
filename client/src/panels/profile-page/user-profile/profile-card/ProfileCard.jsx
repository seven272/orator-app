import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import { fetchProfileData } from '../../../../redux/slices/profileSlice'
import ProfileUserInfo from './profile-user-info/ProfileUserInfo'
import MiniDashboard from './mini-dashboard/MiniDashboard'
import MiniLeaderboard from './mini-leaderboard/MiniLeaderboard'
import styles from './ProfileCard.module.css'

const ProfileCard = ({ user }) => {
  const dispatch = useDispatch()
  // Достаем актуальные данные геймификации и премиума из profileSlice
  const profileState = useSelector((state) => state.profile.user)
  const isPremium = profileState?.isPremium || false
  const premiumExpiresAt = profileState?.premiumExpiresAt

 

  useEffect(() => {
    dispatch(fetchProfileData())
  }, [dispatch])

  return (
    <div className={styles.profile_card}>
      {/* Элемент 1: Информация о пользователе и Премиум */}
      <div className={styles.user_info_wrap}>
        <ProfileUserInfo
          user={user}
          isPremium={isPremium}
          premiumExpiresAt={premiumExpiresAt}
        />
      
      </div>
      <MiniDashboard />

      <MiniLeaderboard />
    </div>
  )
}

export default ProfileCard
