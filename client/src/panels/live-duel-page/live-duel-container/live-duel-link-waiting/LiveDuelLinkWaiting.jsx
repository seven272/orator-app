import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  FiLink2,
  FiCheck,
  FiCopy,
  FiArrowLeft,
  FiSend,
} from 'react-icons/fi'
import vkBridge from '@vkontakte/vk-bridge' // Импортируем VK Bridge

import {
  fetchCheckRoomStatus,
  setSearchStatus,
  resetLiveDuelState,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelLinkWaiting.module.css'

const LiveDuelLinkWaiting = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { currentRoom } = useSelector((state) => state.liveDuel)
  const [timerSeconds, setTimerSeconds] = useState(30)
  const [isLongWaiting, setIsLongWaiting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const countdownRef = useRef(null)
  const pollingRef = useRef(null)
  const roomId = currentRoom?._id

  const VK_APP_ID = 'app54762318' 
  // Ссылка для перехода оппонента
  // const inviteUrl = currentRoom?.inviteToken
  //   ? `${window.location.origin}/#/live-duel/join/${currentRoom.inviteToken}`
  //   : ''

     const inviteUrl = currentRoom?.inviteToken
    ? `https://vk.ru/${VK_APP_ID}/#/live-duel/join/${currentRoom.inviteToken}`
    : ''

  useEffect(() => {
    if (!roomId) return

    // 1. Обратный отсчет до вывода поддерживающего сообщения
    countdownRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          setIsLongWaiting(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // 2. Бесконечный живой пуллинг статуса комнаты
    pollingRef.current = setInterval(() => {
      dispatch(fetchCheckRoomStatus({ roomId }))
        .unwrap()
        .then((res) => {
          if (res.room?.status === 'active') {
            console.log('=== ПУЛЛИНГ: Друг подключился! ===')
            clearInterval(countdownRef.current)
            clearInterval(pollingRef.current)
            dispatch(setSearchStatus('active'))
          }
        })
        .catch((err) => {
          console.error('Ошибка пуллинга комнаты:', err)
        })
    }, 3000)

    return () => {
      clearInterval(countdownRef.current)
      clearInterval(pollingRef.current)
    }
  }, [roomId, dispatch])

  // --- МЕТОД 1: Нативный шеринг внутри ВКонтакте ---
  const handleVkShare = () => {
    if (!inviteUrl) return

    // Проверяем, поддерживает ли среда вызовы VK Bridge (чтобы не упасть на обычном сайте)
    if (vkBridge.supports('VKWebAppShare')) {
      vkBridge
        .send('VKWebAppShare', {
          link: inviteUrl,
        })
        .then((data) => {
          console.log('Пользователь успешно поделился ссылкой:', data)
        })
        .catch((error) => {
          console.error('Ошибка при нативном шеринге VK:', error)
        })
    } else {
      // Фолбэк для веб-версии сайта, если VK Bridge недоступен
      handleCopyLink()
    }
  }

  // --- МЕТОД 2: Классическое копирование в буфер обмена ---
  const handleCopyLink = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleCancelWaiting = () => {
    navigate('/live-duel')
    dispatch(setSearchStatus('idle'))
    dispatch(resetLiveDuelState())
  }

  return (
    <div className={styles.link_waiting_container}>
      <div className={styles.loader_wrapper}>
        <div className={styles.pulse_loader}>
          <FiLink2 className={styles.link_icon} />
        </div>
        <div className={styles.wave_ring}></div>
      </div>

      <h2 className={styles.matching_title}>Ожидание друга...</h2>

      {!isLongWaiting ? (
        <div className={styles.timer_badge}>
          Ссылка активна еще:{' '}
          <span className={styles.seconds_count}>
            {timerSeconds} сек
          </span>
        </div>
      ) : (
        <div className={styles.long_wait_box}>
          <p className={styles.long_wait_text}>
            Ваш оппонент задерживается. Вы можете отправить прямую
            ссылку повторно или подождать еще немного — комната
            активна до момента подключения.
          </p>
        </div>
      )}

      <p className={styles.matching_hint}>
        Отправьте приглашение собеседнику в ВКонтакте или скопируйте
        прямую ссылку.
      </p>

      {/* Блок премиальных кнопок отправки / копирования */}
      <div className={styles.invite_actions_layout}>
        <button
          className={styles.btn_vk_share}
          onClick={handleVkShare}
        >
          <FiSend size={18} />
          <span>Поделиться в VK</span>
        </button>

        <button
          className={`${styles.btn_clipboard_copy} ${isCopied ? styles.copied : ''}`}
          onClick={handleCopyLink}
        >
          {isCopied ? <FiCheck size={18} /> : <FiCopy size={18} />}
          <span>
            {isCopied ? 'Ссылка скопирована' : 'Скопировать ссылку'}
          </span>
        </button>
      </div>

      {/* ВЕРНУЛИ ОТОБРАЖЕНИЕ: Компактный информационный виджет ссылки */}
      {inviteUrl && (
        <div className={styles.preview_link_box}>
          <span className={styles.preview_link_label}>
            Прямой адрес комнаты:
          </span>
          <div className={styles.preview_link_text}>{inviteUrl}</div>
        </div>
      )}

      <div className={styles.action_group}>
        <button
          className={styles.btn_cancel}
          onClick={handleCancelWaiting}
        >
          <FiArrowLeft />
          <span>Вернуться в меню</span>
        </button>
      </div>
    </div>
  )
}

export default LiveDuelLinkWaiting
