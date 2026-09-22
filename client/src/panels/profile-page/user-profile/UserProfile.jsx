import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Modal as AntdModal } from 'antd' // Импортируем Modal из antd с алиасом, чтобы не путать с вашим UI Modal
import { ExclamationCircleFilled } from '@ant-design/icons' // Опционально: красивая иконка предупреждения

import {
  fetchLogoutUser,
  clearMergeConflict,
  checkIsAuth,
} from '../../../redux/slices/authSlice'
import Modal from '../../../UI/modal/Modal'
import AccountMergeContent from './account-merge-content/AccountMergeContent'

import ProfileCard from './profile-card/ProfileCard'
import ProfileForm from './profile-form/ProfileForm'
import ProfileConnections from './profile-connections/ProfileConnections'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import { useViralModalTrigger } from '../../../hooks/useViralModalTrigger'

import styles from './UserProfile.module.css'

const UserProfile = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isVkEnvironment } = useVkEnvironment()

   // Контролирует 3 дня кулдауна через VK Storage строго на экране Профиля [INDEX]
  useViralModalTrigger()

  const { user, isLoading, error, mergeConflict } = useSelector(
    (state) => state.auth,
  )
  const isAuth = useSelector(checkIsAuth)

  // 🛠️ Функция подтверждения выхода через Ant Design
  const showLogoutConfirm = () => {
    AntdModal.confirm({
      title: 'Вы точно хотите покинуть аккаунт?',
      icon: (
        <ExclamationCircleFilled
          style={{ color: 'var(--color-red)', marginRight: '3px' }}
        />
      ),
      content:
        'Чтобы войти снова, потребуются ваши данные авторизации.',
      okText: 'Выйти',
      okType: 'danger',
      cancelText: 'Отмена',
      centered: true, // Красивое центрирование по экрану (особенно на мобильных)
      onOk() {
        dispatch(fetchLogoutUser())
      },
    })
  }

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

      {/* Кнопка скрывается, если приложение запущено внутри ВКонтакте */}
      {!isVkEnvironment && (
        <div className={styles.logout_block}>
          <button
            type="button"
            className={styles.logout_btn}
            onClick={showLogoutConfirm}
            disabled={isLoading}
          >
            Выйти из аккаунта
          </button>
        </div>
      )}

    

      <Modal
        active={mergeConflict !== null}
        onClose={() => dispatch(clearMergeConflict())}
      >
        <AccountMergeContent />
      </Modal>
    </div>
  )
}

export default UserProfile
