import React from 'react'
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
  return (
    <div className={styles.connections_block}>
      <h5 className={styles.sub_heading}>Управление аккаунтами</h5>

      {user?.email && !user?.password && (
        <div className={styles.link_row}>
          <span>🔒 Пароль для входа с Сайта</span>
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
              onSubmit={handleLinkPassword}
              className={styles.inline_email_form}
            >
              <input
                type="password"
                placeholder="Придумайте пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPasswordLinking}
                required
              />
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
    </div>
  )
}

export default ProfileConnections
