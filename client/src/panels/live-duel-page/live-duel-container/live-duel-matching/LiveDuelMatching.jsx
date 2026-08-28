import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
 
import {
  fetchStartLiveDuelAiBot,
  fetchCheckRoomStatus,
  setSearchStatus,
  resetLiveDuelState,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelMatching.module.css'
import LiveDuelAiOffer from '../../live-duel-ui/live-duel-ai-offer/LiveDuelAiOffer'
import LiveDuelPaywall from '../../live-duel-ui/live-duel-paywall/LiveDuelPaywall'

const LiveDuelMatching = () => {
  const dispatch = useDispatch()
    const navigate = useNavigate()
  const { currentRoom, loading } = useSelector(
    (state) => state.liveDuel,
  )
  const { user } = useSelector((state) => state.profile)
  const isPremium = user?.isPremium || false

  const [timerSeconds, setTimerSeconds] = useState(60)
  const [showAiOffer, setShowAiOffer] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const countdownRef = useRef(null)
  const pollingRef = useRef(null)

  const roomId = currentRoom?._id

  useEffect(() => {
    // Если ID комнаты пропал или еще не подгрузился — полностью игнорируем запуск
    if (!roomId) return

    // 1. Таймер обратного отсчета до ИИ
    countdownRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          clearInterval(pollingRef.current)
          setShowAiOffer(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 2. Чистый пуллинг статуса комнаты
    pollingRef.current = setInterval(() => {
      // Передаем изолированную строку roomId, сохраненную на момент старта интервала
      dispatch(fetchCheckRoomStatus({ roomId }))
        .unwrap()
        .then((res) => {
          // Если оппонент зашел, роутер перенаправит нас в саму игру
          if (res.room?.status === 'active') {
            console.log('=== ПУЛЛИНГ: Оппонент подключился! ===')

            // Жестко очищаем таймеры, чтобы они не слали запросы в фоне во время игры
            clearInterval(countdownRef.current)
            clearInterval(pollingRef.current)

            // Явно переводим статус поиска в active для Игрока А
            dispatch(setSearchStatus('active'))
          }
        })
        .catch((err) => {
          console.error('Ошибка пуллинга внутри интервала:', err)
        })
    }, 3000)

    // Строгий клинап при размонтировании экрана или изменении ID
    return () => {
      clearInterval(countdownRef.current)
      clearInterval(pollingRef.current)
    }
  }, [roomId, dispatch])

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

  return (
    <div className={styles.matching_container}>
      <div className={styles.pulse_loader}>
        <div className={styles.circle_core}>🎙️</div>
        <div className={styles.wave_ring}></div>
        <div className={styles.wave_ring_delayed}></div>
      </div>

      <h2 className={styles.matching_title}>Ищем оппонента...</h2>

      <div className={styles.timer_badge}>
        Осталось времени:{' '}
        <span className={styles.seconds_count}>
          {timerSeconds} сек
        </span>
      </div>

      <p className={styles.matching_hint}>
        Бэкенд подбирает оратора равного уровня. Если поиск затянется,
        можно будет устроить дуэль с ИИ.
      </p>

      {loading && (
        <div className={styles.sub_loader_text}>
          Подключаем ИИ-эксперта...
        </div>
      )}
    </div>
  )
}

export default LiveDuelMatching
