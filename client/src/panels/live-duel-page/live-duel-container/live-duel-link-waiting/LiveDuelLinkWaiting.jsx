import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchStartLiveDuelAiBot,
  fetchCheckRoomStatus,
  setSearchStatus,
  resetLiveDuelState,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelLinkWaiting.module.css'
import LiveDuelAiOffer from '../../live-duel-ui/live-duel-ai-offer/LiveDuelAiOffer'
import LiveDuelPaywall from '../../live-duel-ui/live-duel-paywall/LiveDuelPaywall'

const LiveDuelLinkWaiting = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentRoom, loading } = useSelector(
    (state) => state.liveDuel,
  )
  const { user } = useSelector((state) => state.profile)
  const isPremium = user?.isPremium || false

  const [timerSeconds, setTimerSeconds] = useState(10)
  const [isCopied, setIsCopied] = useState(false)
  const [showAiOffer, setShowAiOffer] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const countdownRef = useRef(null)
  const pollingRef = useRef(null)

  const roomId = currentRoom?._id

  const inviteUrl = currentRoom?.inviteToken
    ? `${window.location.origin}/#/live-duel/join/${currentRoom.inviteToken}`
    : ''

  useEffect(() => {
    // Запускаем таймер обратного отсчета
    countdownRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          clearInterval(pollingRef.current)
          if (roomId) {
            setShowAiOffer(true)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Запускаем пуллинг статуса комнаты
    pollingRef.current = setInterval(() => {
      if (roomId) {
        dispatch(fetchCheckRoomStatus({ roomId: roomId }))
          .unwrap()
          .then((res) => {
            if (res.room?.status === 'active') {
              clearInterval(countdownRef.current)
              clearInterval(pollingRef.current)
              // Слайс сам переключит searchStatus на 'active',
              // но для надежности можно сделать переход на игровую панель
              // routeNavigator.push('/live-duel/room')
            }
          })
          .catch(() => {})
      }
    }, 3000)

    return () => {
      clearInterval(countdownRef.current)
      clearInterval(pollingRef.current)
    }
  }, [roomId, dispatch])

  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleAiClick = () => {
    if (!isPremium) {
      setShowPaywall(true)
      return
    }

    dispatch(fetchStartLiveDuelAiBot({ roomId }))
  }

  const handleSubscribeMock = () => {
    // Вызов нативного окна оплаты VK или вашей платежной системы
    alert('Инициализация оплаты Premium подписки...')
  }

  const handleGoMainScreen = () => {
    navigate('/live-duel')
    setShowAiOffer(false)
    setShowPaywall(false)
    dispatch(setSearchStatus('idle'))
    dispatch(resetLiveDuelState())
  }

  if (showPaywall) {
    return (
      <LiveDuelPaywall
        onSubscribe={handleSubscribeMock}
        onBack={() => setShowPaywall(false)}
      />
    )
  }

  if (showAiOffer) {
    return (
      <LiveDuelAiOffer
        onAccept={handleAiClick}
        onBack={handleGoMainScreen}
        loading={loading}
      />
    )
  }
  // --- ЭКРАН 1: Стандартное окно ожидания друга по ссылке ---
  return (
    <div className={styles.link_waiting_container}>
      <div className={styles.pulse_loader}>
        <div className={styles.circle_core}>🔗</div>
        <div className={styles.wave_ring}></div>
        <div className={styles.wave_ring_delayed}></div>
      </div>

      <h2 className={styles.matching_title}>Ожидание друга...</h2>

      <div className={styles.timer_badge}>
        Ждем еще:{' '}
        <span className={styles.seconds_count}>
          {timerSeconds} сек
        </span>
      </div>

      <p className={styles.matching_hint}>
        Отправьте ссылку другу. Если никто не подключится, вы сможете
        сразиться с нашим ИИ-ботом.
      </p>

      <div className={styles.invite_box}>
        <input
          type="text"
          className={styles.invite_input}
          value={inviteUrl}
          readOnly
        />
        <button
          className={`${styles.copy_button} ${isCopied ? styles.copied : ''}`}
          onClick={handleCopyLink}
        >
          {isCopied ? 'Скопировано!' : 'Копировать'}
        </button>
      </div>

      {loading && (
        <div className={styles.sub_loader_text}>
          Подключаем ИИ-эксперта...
        </div>
      )}
    </div>
  )
}

export default LiveDuelLinkWaiting
