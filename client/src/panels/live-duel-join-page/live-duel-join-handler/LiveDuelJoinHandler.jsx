import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import {
  fetchCheckInviteToken,
  fetchJoinLiveRoom,
} from '../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelJoinHandler.module.css' // Импорт стилей

const LiveDuelJoinHandler = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const params = useParams()
  const token = params?.token

 

  const [checking, setChecking] = useState(true)
  const [inviteError, setInviteError] = useState(null)
  const [hostUser, setHostUser] = useState(null)

  const { loading: joiningLoading, error: joiningError } =
    useSelector((state) => state.liveDuel)

  useEffect(() => {
    if (!token) {
      setInviteError('Токен приглашения отсутствует.')
      setChecking(false)
      return
    }

    dispatch(fetchCheckInviteToken({ token }))
      .unwrap()
      .then((res) => {
        setHostUser(res.room?.userA)
        setChecking(false)
      })
      .catch((err) => {
        setInviteError(err)
        setChecking(false)
      })
  }, [token, dispatch])

  const handleConfirmJoin = () => {
    dispatch(fetchJoinLiveRoom({ inviteToken: token }))
      .unwrap()
      .then(() => {
        navigate('/live-duel')
      })
      .catch(() => {})
  }

  const handleGoBack = () => {
    navigate('/live-duel')
  }

  // 1. Состояние проверки ссылки
  if (checking) {
    return (
      <div className={styles.container}>
        <div className={styles.statusText}>Проверка ссылки...</div>
      </div>
    )
  }

  // 2. Состояние ошибки
  if (inviteError || joiningError) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={`${styles.title} ${styles.errorTitle}`}>
            Не удалось подключиться
          </h2>
          <p className={styles.subtitle}>
            {inviteError || joiningError}
          </p>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleGoBack}
          >
            Вернуться в меню
          </button>
        </div>
      </div>
    )
  }

  // 3. Экран подтверждения
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.avatarWrapper}>
          {hostUser?.avatar ? (
            <img
              src={hostUser.avatar}
              alt="Avatar"
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>🎙️</div>
          )}
        </div>

        <h2 className={styles.title}>Вас вызывают на дуэль!</h2>
        <p className={styles.subtitle}>
          Пользователь{' '}
          <strong>{hostUser?.displayName || 'Оратор'}</strong> приглашает
          вас на баттл.
        </p>

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleConfirmJoin}
            disabled={joiningLoading}
          >
            {joiningLoading ? 'Вход...' : 'Принять вызов'}
          </button>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={handleGoBack}
            disabled={joiningLoading}
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiveDuelJoinHandler
