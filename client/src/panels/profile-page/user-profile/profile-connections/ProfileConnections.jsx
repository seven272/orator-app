/* eslint-disable react/prop-types */
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'

import { fetchLinkEmail } from '../../../../redux/slices/authSlice'
import { validatePassword } from '../../../../utils/passwordValidator'
import styles from './ProfileConnections.module.css'

const ProfileConnections = () => {
  const dispatch = useDispatch()

  // Сами забираем нужные данные из Redux
  const { user, isLoading } = useSelector((state) => state.auth)

  // Переносим стейты привязки пароля и почты внутрь
  const [emailInput, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [isPasswordLinking, setIsPasswordLinking] = useState(false)

  // Проверка среды запуска
  const isInsideVkParams =
    window.location.search.includes('vk_user_id')

  const onFormSubmit = async (e) => {
    e.preventDefault()
    // Проверяем введенный пароль и прокидываем emailInput для сверки дубликатов
    const validation = validatePassword(
      password,
      user?.email || emailInput,
    )

    if (!validation.isValid) {
      message.error(validation.message)
      return
    }
    setIsPasswordLinking(true)
    try {
      //formData содержит { email, password }, отправляем в Thunk
      await dispatch(
        fetchLinkEmail({
          email: user?.email || emailInput,
          password: password,
        }),
      ).unwrap()

      message.success('Пароль успешно создан!')
      setShowPasswordForm(false)
      setPassword('')
      setEmailInput('')
    } catch (err) {
      if (err?.code !== 'EMAIL_ALREADY_TAKEN') {
        message.error(err?.message || 'Ошибка при создании пароля')
      }
    } finally {
      setIsPasswordLinking(false)
    }
  }

  const handleLinkVkClick = () => {
    alert('Запуск процесса привязки ВКонтакте...')
  }

  return (
    <div className={styles.connections_block}>
      <h5 className={styles.sub_heading}>Управление аккаунтами</h5>

      {/* --- КЕЙС 1: Пользователь зарегистрирован из ВК, у него НЕТ почты --- */}
      {!user?.email && (
        <div className={styles.link_row}>
          <span>📧 Привязать Email и Пароль для Сайта</span>
          {!showPasswordForm ? (
            <button
              type="button"
              className={styles.secondary_btn}
              onClick={() => setShowPasswordForm(true)}
            >
              Привязать
            </button>
          ) : (
            <form
              onSubmit={onFormSubmit}
              className={styles.inline_email_form}
            >
              <div className={styles.form_field_group}>
                <label>Ваш Email:</label>
                <input
                  type="email"
                  placeholder="example@mail.ru"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={isPasswordLinking}
                  required
                />
              </div>
              <div className={styles.form_field_group}>
                <label>Придумайте пароль:</label>
                <input
                  type="password"
                  placeholder="Не менее 6 символов"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPasswordLinking}
                  required
                />
              </div>
              <div className={styles.inline_form_actions}>
                <button
                  type="submit"
                  className={styles.success_btn}
                  disabled={isPasswordLinking}
                >
                  {isPasswordLinking ? '...' : 'ОК'}
                </button>
                <button
                  type="button"
                  className={styles.cancel_btn}
                  onClick={() => setShowPasswordForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* --- КЕЙС 2: Пользователь вошел по Email, но у него еще нет пароля для авторизации через Яндекс или Гугл--- */}
      {/* {user?.email && !user?.password && (
        <div className={styles.link_row}>
          <span>🔒 Создать пароль для Сайта</span>
          {!showPasswordForm ? (
            <button
              type="button"
              className={styles.secondary_btn}
              onClick={() => setShowPasswordForm(true)}
            >
              Создать пароль
            </button>
          ) : (
            <form
              onSubmit={onFormSubmit}
              className={styles.inline_email_form}
            >
              <div className={styles.form_field_group}>
                <label>Введите пароль:</label>
                <input
                  type="password"
                  placeholder="Придумайте надежный пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPasswordLinking}
                  required
                />
              </div>
              <div className={styles.inline_form_actions}>
                <button
                  type="submit"
                  className={styles.success_btn}
                  disabled={isPasswordLinking}
                >
                  {isPasswordLinking ? '...' : 'ОК'}
                </button>
                <button
                  type="button"
                  className={styles.cancel_btn}
                  onClick={() => setShowPasswordForm(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )} */}

      {/* --- БЛОК СВЯЗИ С ВКОНТАКТЕ --- */}
      {!isInsideVkParams && (
        <div className={styles.link_row}>
          <span>🔵 ВКонтакте:</span>
          {user?.vkId ? (
            <span className={styles.status_connected}>
              Подключено ✅
            </span>
          ) : (
            <button
              type="button"
              className={styles.vk_btn}
              onClick={handleLinkVkClick}
              disabled={isLoading}
            >
              Привязать VK
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ProfileConnections
