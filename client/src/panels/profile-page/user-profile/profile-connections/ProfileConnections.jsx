import React, { useState } from 'react'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import styles from './ProfileConnections.module.css'

const ProfileConnections = ({
  user,
  isLoading,
  password,
  setPassword,
  showPasswordForm,
  setShowPasswordForm,
  isPasswordLinking,
  handleLinkPassword,
  handleLinkVkClick
}) => {
  // Локальный стейт для ввода почты (актуально, если юзер пришел из ВК и привязывает её впервые)
  const [emailInput, setEmailInput] = useState('')

  // Динамически определяем, запущено ли приложение в экосистеме ВКонтакте
  const isInsideVkParams = window.location.search.includes('vk_user_id')

  const onFormSubmit = (e) => {
    e.preventDefault()
    // Передаем в родительский метод введенные данные
    handleLinkPassword({
      email: user?.email || emailInput,
      password: password
    })
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
            <form onSubmit={onFormSubmit} className={styles.inline_email_form}>
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

      {/* --- КЕЙС 2: Пользователь вошел по Email, но у него еще нет пароля (редкий стыковочный случай) --- */}
      {user?.email && !user?.password && (
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
            <form onSubmit={onFormSubmit} className={styles.inline_email_form}>
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
      )}

      {/* --- БЛОК СВЯЗИ С ВКОНТАКТЕ --- */}
      {/* Если мы запущены внутри ВК, прячем эту строку, так как ВК уже является главным провайдером */}
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
