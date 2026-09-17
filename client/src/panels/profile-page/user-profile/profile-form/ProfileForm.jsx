import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'
import { FiUser } from 'react-icons/fi'
import { FaRegEdit } from 'react-icons/fa'

import { fetchUpdateProfile } from '../../../../redux/slices/authSlice'
import axiosInstance from '../../../../utils/axiosInstance'
import usePreviewImg from '../../../../utils/usePreviewImg'
import styles from './ProfileForm.module.css'

const ProfileForm = () => {
  const dispatch = useDispatch()
  const avatarInputRef = useRef(null)

  const { user, isLoading } = useSelector((state) => state.auth)

  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [displayName, setDisplayName] = useState(
    user?.displayName || '',
  )
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')

  // 🔥 НОВЫЙ СТЕЙТ: Для изменения существующего пароля
  const [newPassword, setNewPassword] = useState('')

  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const { handleImageChange, imgUrl, setImgUrl } = usePreviewImg()

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setDisplayName(user.displayName || '')
      setEmail(user.email || '')
      setAvatar(user.avatar || '')
    }
  }, [user])

  useEffect(() => {
    if (avatar && avatar !== '') {
      setImgUrl(avatar)
    }
  }, [avatar, setImgUrl])

  const handleUpdateProfile = async (evt) => {
    evt.preventDefault()
    setIsProfileSaving(true)
    try {
      // 🔥 Передаем newPassword на бэкенд вместе со всеми полями
      await dispatch(
        fetchUpdateProfile({
          firstName,
          lastName,
          displayName,
          email,
          avatar,
          password: newPassword || undefined, // отправляем только если заполнено
        }),
      ).unwrap()

      message.success('Профиль успешно обновлен!')
      setNewPassword('') // зачищаем инпут пароля после успеха
    } catch (err) {
      message.error(err || 'Не удалось обновить профиль')
    } finally {
      setIsProfileSaving(false)
    }
  }

  const handleAvatarChange = async (evt) => {
    const fileData = evt.target.files?.[0]
    if (!fileData) return

    try {
      const formData = new FormData()
      formData.append('avatar', fileData)

      const { data } = await axiosInstance.post(
        '/user/upload-avatar',
        formData,
      )
      const url = data.url

      if (url) {
        const serverBaseUrl =
          axiosInstance.defaults.baseURL || 'http://localhost:5020'
        const cleanBaseUrl = serverBaseUrl.endsWith('/')
          ? serverBaseUrl.slice(0, -1)
          : serverBaseUrl
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

  const handleResetAvatar = () => {
    const originalAvatar =
      user?.socialProfilesData?.vk?.avatar ||
      user?.socialProfilesData?.google?.avatar
    if (originalAvatar) {
      setAvatar(originalAvatar)
      setImgUrl(originalAvatar)
    }
  }

  const hasSocialAvatar = Boolean(
    user?.socialProfilesData?.vk?.avatar ||
    user?.socialProfilesData?.google?.avatar,
  )
  const isAvatarChanged =
    avatar !==
    (user?.socialProfilesData?.vk?.avatar ||
      user?.socialProfilesData?.google?.avatar)

  // 📌 🔥 УМНОЕ УСЛОВИЕ: Поля Email/Пароль видны, если юзер пришел с сайта (нет vkId)
  // ИЛИ если он из ВК, но УЖЕ привязал почту через блок ProfileConnections
  const isEmailFieldsVisible =
    !user?.vkId || (user?.vkId && user?.email)

  return (
    <form
      onSubmit={handleUpdateProfile}
      className={styles.form_profile}
    >
      <h5 className={styles.sub_heading}>
        <FaRegEdit className={styles.heading_icon} />
        Редактировать личные данные
      </h5>

      <div className={styles.avatar_edit_section}>
        <div className={styles.preview_box}>
          <label className={styles.input_label_mini}>
            Превью аватара
          </label>
          {imgUrl ? (
            <img
              src={imgUrl}
              alt="Avatar Preview"
              className={styles.avatar_preview_img}
            />
          ) : (
            <FiUser size={35} className={styles.avatar_icon} />
          )}
        </div>
        <div className={styles.avatar_actions_box}>
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            style={{ display: 'none' }}
            disabled={isProfileSaving}
          />
          <button
            type="button"
            className={styles.upload_btn_inline}
            onClick={() => avatarInputRef.current.click()}
            disabled={isProfileSaving}
          >
            Выбрать новый файл
          </button>

          {hasSocialAvatar && isAvatarChanged && (
            <button
              type="button"
              className={styles.reset_avatar_link}
              onClick={handleResetAvatar}
              disabled={isProfileSaving}
            >
              Вернуть из соцсети
            </button>
          )}
        </div>
      </div>

      <div className={styles.input_group}>
        <label>Никнейм</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Ваш никнейм"
          disabled={isProfileSaving}
          required
        />
      </div>

      <div className={styles.input_group}>
        <label>Имя</label>
        <input
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Имя"
          disabled={isProfileSaving}
        />
      </div>

      <div className={styles.input_group}>
        <label>Фамилия</label>
        <input
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Фамилия"
          disabled={isProfileSaving}
        />
      </div>

      {/* 📌 🔥 ДИНАМИЧЕСКИЕ ПОЛЯ: Рендерим почту и смену пароля только по нашему условию */}
      {isEmailFieldsVisible && (
        <>
          <div className={styles.input_group}>
            <label>Email (Почта)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.ru"
              disabled={isProfileSaving}
            />
          </div>

          <div className={styles.input_group}>
            <label>Новый пароль (Если хотите изменить)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Введите новый пароль"
              disabled={isProfileSaving}
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className={styles.primary_btn}
        disabled={isProfileSaving || isLoading}
      >
        {isProfileSaving ? 'Сохранение...' : 'Сохранить изменения'}
      </button>
    </form>
  )
}

export default ProfileForm
