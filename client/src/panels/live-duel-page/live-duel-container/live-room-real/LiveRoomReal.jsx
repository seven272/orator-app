import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FiPhoneCall, FiCornerRightDown, FiClock, FiCheckCircle, FiLoader } from 'react-icons/fi'
import vkBridge from '@vkontakte/vk-bridge'

import {
  resetLiveDuelState,
  fetchSubmitLiveRating,
  fetchCheckRatingStatus,
  fetchUpdateCallLink,     // Наш новый экшен отправки ссылки
  fetchCheckRoomStatus     // Пуллинг для обновления ссылки у Игрока Б
} from '../../../../redux/slices/liveDuelSlice'
import LiveRoomRewardModal from './live-room-reward-modal/LiveRoomRewardModal'
import styles from './LiveRoomReal.module.css'

const LiveRoomReal = () => {
  const dispatch = useDispatch()
  const { currentRoom, opponentRating, isRatingSubmitted, loading } = useSelector((state) => state.liveDuel)
  const currentUserId = useSelector(
    (state) => state.profile?.user?._id || state.auth?.user?._id,
  )

  // ПРОДАКШЕН ТАЙМЕРЫ (в секундах): intro (30с), monologues (120с), blitz (60с)
  const ROUND_TIMES = {
    intro: 30,
    speakerA: 120,
    speakerB: 120,
    blitz: 60,
    feedback: 0
  }

  const [currentRound, setCurrentRound] = useState('intro')
  const [timeLeft, setTimeLeft] = useState(ROUND_TIMES.intro) 
  const [isVoted, setIsVoted] = useState(false)
  const [isOpponentLeaved, setIsOpponentLeaved] = useState(false) 

  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardsData, setRewardsData] = useState(null)

  const timerRef = useRef(null)
  const pollingInterval = useRef(null)
  const callSyncInterval = useRef(null) // Интервал пуллинга ссылки звонка для Игрока Б
  const timeoutId = useRef(null)

  const roomId = currentRoom?._id

  // Позиция текущего пользователя
  const isSpeakerA = currentRoom?.userA === currentUserId
  const mySide = isSpeakerA
    ? currentRoom?.topic?.sideA
    : currentRoom?.topic?.sideB

  // 1. Жизненный цикл таймеров дискуссии
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (currentRound === 'intro') {
            setCurrentRound('speakerA')
            return ROUND_TIMES.speakerA
          } else if (currentRound === 'speakerA') {
            setCurrentRound('speakerB')
            return ROUND_TIMES.speakerB
          } else if (currentRound === 'speakerB') {
            setCurrentRound('blitz')
            return ROUND_TIMES.blitz
          } else {
            clearInterval(timerRef.current)
            setCurrentRound('feedback')
            return 0
          }
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [currentRound])

  // 2. Инициализация звонка и подписка на события VK Bridge
  useEffect(() => {
    // СЦЕНАРИЙ ИГРОКА А: Создание звонка на старте комнаты
    if (isSpeakerA && roomId && !currentRoom?.vkCallLink) {
      if (vkBridge.supports('VKWebAppCallStart')) {
        vkBridge
          .send('VKWebAppCallStart', {})
          .then((data) => {
            if (data.call_link) {
              dispatch(fetchUpdateCallLink({
                roomId: roomId,
                vkCallLink: data.call_link,
                vkCallId: data.call_id || ''
              }))
            }
          })
          .catch((err) => console.error('Ошибка VKWebAppCallStart:', err))
      }
    }

    // СЦЕНАРИЙ ИГРОКА Б: Если ссылки еще нет, запускаем пуллинг комнаты каждые 2.5 сек
    if (!isSpeakerA && roomId && !currentRoom?.vkCallLink) {
      callSyncInterval.current = setInterval(() => {
        dispatch(fetchCheckRoomStatus({ roomId }))
          .unwrap()
          .then((res) => {
            // Если ссылка прилетела — глушим интервал пуллинга
            if (res.room?.vkCallLink) {
              clearInterval(callSyncInterval.current)
            }
          })
      }, 2500)
    }

    // СЛУШАТЕЛЬ НА ТРУБКУ: Если кто-то вышел из звонка — перекидываем на фидбек
    const handleBridgeEvents = (e) => {
      const { type } = e.detail
      if (type === 'VKWebAppCallLeft' || type === 'VKWebAppCallFinished') {
        console.log('VK Звонок завершен:', type)
        setCurrentRound('feedback')
      }
    }

    vkBridge.subscribe(handleBridgeEvents)
    return () => {
      vkBridge.unsubscribe(handleBridgeEvents)
      clearInterval(callSyncInterval.current)
    }
  }, [isSpeakerA, roomId, currentRoom?.vkCallLink, dispatch])

  // Очистка интервала пуллинга ссылки, если она успешно подгрузилась в процессе
  useEffect(() => {
    if (currentRoom?.vkCallLink && callSyncInterval.current) {
      clearInterval(callSyncInterval.current)
    }
  }, [currentRoom?.vkCallLink])

  // 3. Взаимный пуллинг оценок на финише
  useEffect(() => {
    if (isRatingSubmitted && roomId) {
      pollingInterval.current = setInterval(() => {
        dispatch(fetchCheckRatingStatus(roomId))
      }, 2500)

      timeoutId.current = setTimeout(() => {
        clearInterval(pollingInterval.current)
        setIsOpponentLeaved(true) 
      }, 15000)
    }

    if (opponentRating !== null) {
      clearInterval(pollingInterval.current)
      clearTimeout(timeoutId.current)
    }

    return () => {
      clearInterval(pollingInterval.current)
      clearTimeout(timeoutId.current)
    }
  }, [isRatingSubmitted, opponentRating, roomId, dispatch])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const getRoundTitle = () => {
    switch (currentRound) {
      case 'intro': return '🤝 Знакомство и подготовка'
      case 'speakerA': return '📢 Монолог Спикера А'
      case 'speakerB': return '📢 Монолог Спикера Б'
      case 'blitz': return '⚡ Блиц-раунд (Вопросы)'
      case 'feedback': return '🏆 Выставление оценок'
      default: return ''
    }
  }

  // Нативное подключение к звонку
  const handleOpenVkCall = (evt) => {
    evt.preventDefault()
    if (!currentRoom?.vkCallLink) return

    if (!isSpeakerA && vkBridge.supports('VKWebAppCallJoin')) {
      // Игрок Б нативно «врезается» в существующий звонок Игрока А
      vkBridge
        .send('VKWebAppCallJoin', { call_link: currentRoom.vkCallLink })
        .catch((err) => {
          console.error('Ошибка VKWebAppCallJoin, фолбэк на OpenURL:', err)
          vkBridge.send('VKWebAppOpenURL', { url: currentRoom.vkCallLink })
        })
    } else {
      // Игрок А или веб-версия
      if (vkBridge.supports('VKWebAppOpenURL')) {
        vkBridge.send('VKWebAppOpenURL', { url: currentRoom.vkCallLink })
      } else {
        window.open(currentRoom.vkCallLink, '_blank', 'noopener,noreferrer')
      }
    }
  }

  const handleVoteSubmit = (rating) => {
    if (!currentRoom?._id) return
    setIsVoted(true)

    dispatch(fetchSubmitLiveRating({ roomId: currentRoom._id, rating }))
      .unwrap()
      .then((data) => {
        setRewardsData({
          rating,
          earnedXp: data.earnedXp,
          earnedCoins: data.earnedCoins,
          isLevelUp: data.isLevelUp,
          newLevel: data.stats?.level,
          achievements: data.newAchievements || [],
        })
        setShowRewardModal(true)
      })
      .catch((err) => {
        alert(`Ошибка при сохранении результатов: ${err}`)
        setIsVoted(false)
      })
  }

  const handleCloseModal = () => {
    setShowRewardModal(false)
    dispatch(resetLiveDuelState())
  }
  return (
    <div className={styles.duel_room_container}>
      {/* Шапка с таймером */}
      <div className={styles.header_card}>
        <span className={styles.round_badge}>{getRoundTitle()}</span>
        {currentRound !== 'feedback' && (
          <h1 className={styles.timer_display}>
            <FiClock className={styles.clock_icon} />
            <span>{formatTime(timeLeft)}</span>
          </h1>
        )}
      </div>

      {/* Карточка темы */}
      <div className={styles.topic_card}>
        <h3 className={styles.topic_label}>Тема дискуссии:</h3>
        <h2 className={styles.topic_title}>«{currentRoom?.topic?.title}»</h2>
        <div className={styles.my_position_box}>
          Ваша позиция: <strong className={styles.side_highlight}>{mySide}</strong>
        </div>
      </div>

      {/* Активные раунды общения */}
      {currentRound !== 'feedback' && (
        <div className={styles.action_block}>
          <div className={styles.turn_indicator}>
            {currentRound === 'speakerA' && (
              <p className={isSpeakerA ? styles.your_turn : styles.opponent_turn}>
                {isSpeakerA ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.' : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
              </p>
            )}
            {currentRound === 'speakerB' && (
              <p className={!isSpeakerA ? styles.your_turn : styles.opponent_turn}>
                {!isSpeakerA ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.' : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
              </p>
            )}
            {currentRound === 'blitz' && (
              <p className={styles.blitz_turn}>🔥 Свободная дискуссия! Задавайте вопросы и отвечайте взаимно.</p>
            )}
          </div>

          {/* ДИНАМИЧЕСКАЯ КНОПКА ЗВОНКА С ЗАЩИТОЙ ОТ ПРЕЖДЕВРЕМЕННОГО КЛИКА */}
          {!currentRoom?.vkCallLink ? (
            <div className={styles.sync_loader_badge}>
              <FiLoader className={styles.sync_spinner} />
              <span>{isSpeakerA ? 'Инициализация звонка...' : 'Синхронизация видеосвязи...'}</span>
            </div>
          ) : (
            <button onClick={handleOpenVkCall} className={styles.vk_call_btn}>
              <FiPhoneCall size={18} />
              <span>Открыть VK Звонок</span>
            </button>
          )}

          {/* Премиальная интерактивная инструкция свертывания звонка в PiP */}
          <div className={styles.pip_instruction_card}>
            <div className={styles.pip_header}>
              <div className={styles.pip_pulse_dot}></div>
              <h4>Как одновременно видеть таймер?</h4>
            </div>
            <p className={styles.pip_text}>
              После старта звонка нажмите кнопку <strong>«Свернуть»</strong> внутри интерфейса VK. 
              Видео перейдет в плавающее окно, а перед вами откроется таймер текущего раунда дебатов.
            </p>
            <div className={styles.pip_animation_container}>
              <div className={styles.mock_phone}>
                <div className={styles.mock_video_overlay}>🎙️ Видеозвонок</div>
                <div className={styles.mock_arrow_stream}>
                  <FiCornerRightDown className={styles.animated_arrow} />
                </div>
                <div className={styles.mock_pip_window}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Экран взаимного оценивания */}
      {currentRound === 'feedback' && (
        <div className={styles.feedback_block}>
          {!isVoted ? (
            <>
              <h3 className={styles.feedback_title}>Как справился ваш оппонент?</h3>
              <p className={styles.feedback_description}>Оцените структуру аргументов, уверенность речи и навыки контратакапирования.</p>
              <div className={styles.rating_buttons}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} className={styles.rating_btn} onClick={() => handleVoteSubmit(num)} disabled={loading}>
                    {num}
                  </button>
                ))}
              </div>
              <button className={styles.skip_btn} onClick={() => handleVoteSubmit(null)} disabled={loading}>
                Пропустить оценку
              </button>
            </>
          ) : (
            <div className={styles.success_vote}>
              <div className={styles.loader_box}>
                {opponentRating === null && !isOpponentLeaved ? (
                  <>
                    <div className={styles.spinner}></div>
                    <p>Ожидаем решение второго оратора...</p>
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={44} className={styles.success_check_icon} />
                    <div className={styles.opponent_rating_info}>
                      {isOpponentLeaved ? (
                        <p className={styles.muted_text}>Оппонент завершил сессию, не выставив оценку. Награды уже начислены в ваш профиль!</p>
                      ) : (
                        <>
                          <h3>Ваш итоговый рейтинг за бой:</h3>
                          <div className={styles.stars_display}>{'★'.repeat(opponentRating)}</div>
                        </>
                      )}
                    </div>
                    <button className={styles.leave_room_btn} onClick={handleCloseModal}>
                      Вернуться в главное меню
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {showRewardModal && <LiveRoomRewardModal data={rewardsData} onClose={handleCloseModal} />}
    </div>
  )
}

export default LiveRoomReal
