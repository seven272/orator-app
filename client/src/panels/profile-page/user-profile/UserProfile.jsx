import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { fetchLogoutUser, clearMergeConflict, checkIsAuth } from '../../../redux/slices/authSlice'
import Modal from '../../../UI/modal/Modal'
import AccountMergeContent from './account-merge-content/AccountMergeContent'

import ProfileCard from './profile-card/ProfileCard' 
import ProfileForm from './profile-form/ProfileForm'
import ProfileConnections from './profile-connections/ProfileConnections'

import styles from './UserProfile.module.css'

const UserProfile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { user, isLoading, error, mergeConflict } = useSelector((state) => state.auth)
  const isAuth = useSelector(checkIsAuth)

  // 🔒 Защита роута
  useEffect(() => {
    if (!isLoading && !isAuth) {
      navigate('/auth', { replace: true })
    }
  }, [isAuth, isLoading, navigate])

  if (isLoading && !user) return null

  return (
    <div className={styles.container}>
      <ProfileCard user={user} />

      {error && <div className={styles.server_error}>{error}</div>}

      {/* Полностью независимые блоки без Prop Drilling */}
      <ProfileForm />
      <ProfileConnections />

      <div className={styles.logout_block}>
        <button
          type="button"
          className={styles.logout_btn}
          onClick={() => {
            if (window.confirm('Вы уверены, что хотите покинуть аккаунт?')) {
              dispatch(fetchLogoutUser())
            }
          }}
          disabled={isLoading}
        >
          Выйти из аккаунта
        </button>
      </div>

      <Modal active={mergeConflict !== null} onClose={() => dispatch(clearMergeConflict())}>
        <AccountMergeContent />
      </Modal>
    </div>
  )
}

export default UserProfile
