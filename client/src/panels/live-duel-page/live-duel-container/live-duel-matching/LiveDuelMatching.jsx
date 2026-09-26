import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiLoader, FiArrowLeft, FiShare2 } from 'react-icons/fi'

import {
  fetchCheckRoomStatus,
  setSearchStatus,
  resetLiveDuelState,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelMatching.module.css'

const LiveDuelMatching = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const { currentRoom } = useSelector((state) => state.liveDuel)
  const [timerSeconds, setTimerSeconds] = useState(60)
  const [isSearchTimeout, setIsSearchTimeout] = useState(false)

  const countdownRef = useRef(null)
  const pollingRef = useRef(null)
  const roomId = currentRoom?._id

  useEffect(() => {
    if (!roomId) return

    // 1. Таймер обратного отсчета до вывода финального сообщения
    countdownRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          setIsSearchTimeout(true) // Активируем финальное текстовое сообщение
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 2. Постоянный живой пуллинг статуса комнаты (идет непрерывно)
    pollingRef.current = setInterval(() => {
      dispatch(fetchCheckRoomStatus({ roomId }))
        .unwrap()
        .then((res) => {
          if (res.room?.status === 'active') {
            console.log('=== ПУЛЛИНГ: Оппонент подключился! ===')
            clearInterval(countdownRef.current)
            clearInterval(pollingRef.current)
            dispatch(setSearchStatus('active'))
          }
        })
        .catch((err) => {
          console.error('Ошибка пуллинга внутри интервала:', err)
        })
    }, 3000)

    return () => {
      clearInterval(countdownRef.current)
      clearInterval(pollingRef.current)
    }
  }, [roomId, dispatch])

  const handleCancelSearch = () => {
    navigate('/live-duel')
    dispatch(setSearchStatus('idle'))
    dispatch(resetLiveDuelState())
  }

  const handleGoToCalendar = () => {
    dispatch(setSearchStatus('slot_create'))
  }

  return (
    <div className={styles.matching_container}>
      {/* Премиальный пульсирующий индикатор поиска */}
      <div className={styles.loader_wrapper}>
        <div className={styles.pulse_loader}>
          <FiLoader className={styles.spinner_icon} />
        </div>
        <div className={styles.wave_ring}></div>
      </div>

      <h2 className={styles.matching_title}>
        {isSearchTimeout ? 'Поиск затягивается...' : 'Ищем оппонента...'}
      </h2>

      {/* Отображение таймера или финального текста */}
      {!isSearchTimeout ? (
        <div className={styles.timer_badge}>
          Осталось времени:{' '}
          <span className={styles.seconds_count}>{timerSeconds} сек</span>
        </div>
      ) : (
        <div className={styles.timeout_message_box}>
          <p className={styles.timeout_text}>
            Свободные спикеры сейчас заняты в поединках. Система продолжает 
            фоновый подбор пары, но вы можете зафиксировать удобное время самостоятельно.
          </p>
        </div>
      )}

      <p className={styles.matching_hint}>
        Бэкенд подбирает оратора равного уровня для честного и аргументированного баттла.
      </p>

      {/* Управляющие кнопки */}
      <div className={styles.action_group}>
        {isSearchTimeout && (
          <button 
            className={styles.btn_calendar} 
            onClick={handleGoToCalendar}
          >
            <FiShare2 />
            <span>Предложить свое время</span>
          </button>
        )}
        
        <button 
          className={styles.btn_cancel} 
          onClick={handleCancelSearch}
        >
          <FiArrowLeft />
          <span>Отменить поиск</span>
        </button>
      </div>
    </div>
  )
}

export default LiveDuelMatching
