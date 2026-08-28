import { useState, useEffect } from 'react'
import { message } from 'antd'
import { useSelector, useDispatch } from 'react-redux'

import {
  fetchUpdateProfile,
  fetchLogoutUser,
  fetchLinkEmail,
  clearMergeConflict,
} from '../../../redux/slices/authSlice'

import Modal from '../../../UI/modal/Modal'
import AccountMergeContent from './account-merge-content/AccountMergeContent'
import axiosInstance from '../../../utils/axiosInstance'
import usePreviewImg from '../../../utils/usePreviewImg'

// Импорт всех декомпозированных компонентов
import ProfileCard from './profile-card/ProfileCard'
import ProfileForm from './profile-form/ProfileForm'
import ProfileConnections from './profile-connections/ProfileConnections'

import styles from './UserProfile.module.css'

const UserProfile = () => {
  const dispatch = useDispatch()
  const { user, isLoading, error, mergeConflict } = useSelector((state) => state.auth)

  // Локальные стейты для редактирования профиля
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')

  // Локальные стейты для первичной привязки пароля
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState('')

  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [isPasswordLinking, setIsPasswordLinking] = useState(false)

  // Подключаем хук превью для изображений
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg()

  // Синхронизируем стейт превью при изменении аватара
  useEffect(() => {
    if (avatar && avatar !== '') {
      setImgUrl(avatar)
    }
  }, [avatar, setImgUrl])

  // 1. Хэндлер сохранения ВСЕХ личных данных
  const handleUpdateProfile = async (evt) => {
    evt.preventDefault()
    setIsProfileSaving(true)
    try {
      await dispatch(fetchUpdateProfile({ firstName, lastName, displayName, email, avatar })).unwrap()
      message.success('Профиль успешно обновлен!')
    } catch (err) {
      message.error(err || 'Не удалось обновить профиль')
    } finally {
      setIsProfileSaving(false)
    }
  }

  // 2. Хэндлер отправки файла аватара на сервер через FormData
  const handleAvatarChange = async (evt) => {
    const fileData = evt.target.files?.[0]
    if (!fileData) return

    try {
      const formData = new FormData()
      formData.append('avatar', fileData)
      
      const { data } = await axiosInstance.post('/user/upload-avatar', formData)
      const url = data.url
 
      if (url) {
        const serverBaseUrl = axiosInstance.defaults.baseURL || 'http://localhost:5020'
        const cleanBaseUrl = serverBaseUrl.endsWith('/') ? serverBaseUrl.slice(0, -1) : serverBaseUrl
        const cleanFileUrl = url.startsWith('/') ? url : `/${url}`
        const finalAvatarUrl = `${cleanBaseUrl}${cleanFileUrl}`
        
        setAvatar(finalAvatarUrl) 
        handleImageChange(evt) 
      }
      message.success('Изображение загружено на сервер')
    } catch (error) {
      console.warn(error)
      message.error('Ошибка при загрузке изображения')
    }
  }

  // Сброс аватара до оригинального из соцсети
  const handleResetAvatar = () => {
    const originalAvatar = user?.socialProfilesData?.vk?.avatar || user?.socialProfilesData?.google?.avatar
    if (originalAvatar) {
      setAvatar(originalAvatar)
      setImgUrl(originalAvatar)
    }
  }

  const handleLinkPassword = async (e) => {
    e.preventDefault()
    setIsPasswordLinking(true)
    try {
      await dispatch(fetchLinkEmail({ email: user?.email || email, password })).unwrap()
      message.success('Пароль успешно создан!')
      setShowPasswordForm(false)
    } catch (err) {
      if (err?.code !== 'EMAIL_ALREADY_TAKEN') {
        message.error(err?.message || 'Ошибка при создании пароля')
      }
    } finally {
      setIsPasswordLinking(false)
    }
  }

  const handleLinkVkClick = () => {
    alert('Запуск процесса авторизации ВКонтакте...')
  }

  const hasSocialAvatar = Boolean(user?.socialProfilesData?.vk?.avatar || user?.socialProfilesData?.google?.avatar)
  const isAvatarChanged = avatar !== (user?.socialProfilesData?.vk?.avatar || user?.socialProfilesData?.google?.avatar)

  return (
    <div className={styles.container}>
      
      {/* БЛОК 1: КАРТОЧКА В ШАПКЕ */}
      <ProfileCard user={user} />

      {error && <div className={styles.server_error}>{error}</div>}

      {/* БЛОК 2: ФОРМА ЛИЧНЫХ ДАННЫХ */}
      <ProfileForm 
        firstName={firstName} setFirstName={setFirstName}
        lastName={lastName} setLastName={setLastName}
        displayName={displayName} setDisplayName={setDisplayName}
        email={email} setEmail={setEmail}
        imgUrl={imgUrl}
        isProfileSaving={isProfileSaving}
        isLoading={isLoading}
        hasSocialAvatar={hasSocialAvatar}
        isAvatarChanged={isAvatarChanged}
        handleAvatarChange={handleAvatarChange}
        handleResetAvatar={handleResetAvatar}
        handleUpdateProfile={handleUpdateProfile}
      />

      {/* БЛОК 3: УПРАВЛЕНИЕ СВЯЗЯМИ */}
      <ProfileConnections 
        user={user}
        isLoading={isLoading}
        password={password}
        setPassword={setPassword}
        showPasswordForm={showPasswordForm}
        setShowPasswordForm={setShowPasswordForm}
        isPasswordLinking={isPasswordLinking}
        handleLinkPassword={handleLinkPassword}
        handleLinkVkClick={handleLinkVkClick}
      />

      {/* БЛОК 4: ВЫХОД ИЗ СИСТЕМЫ */}
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
