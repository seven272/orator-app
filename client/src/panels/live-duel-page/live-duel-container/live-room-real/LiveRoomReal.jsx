import React, { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  resetLiveDuelState,
  fetchSubmitLiveRating,
  fetchCheckRatingStatus
} from '../../../../redux/slices/liveDuelSlice'
import LiveRoomRewardModal from './live-room-reward-modal/LiveRoomRewardModal'
import styles from './LiveRoomReal.module.css'

const LiveRoomReal = () => {
  const dispatch = useDispatch()
  const { currentRoom, opponentRating, isRatingSubmitted, loading } = useSelector((state) => state.liveDuel)
  const currentUserId = useSelector(
    (state) => state.profile?.user?._id || state.auth?.user?._id,
  )

  // Инициализация раундов: 'intro' (0:30), 'speakerA' (2:00), 'speakerB' (2:00), 'blitz' (1:00), 'feedback'
  const [currentRound, setCurrentRound] = useState('intro')
  const [timeLeft, setTimeLeft] = useState(3) // Стартуем с 30 секунд на знакомство
  const [isVoted, setIsVoted] = useState(false)
  const [isOpponentLeaved, setIsOpponentLeaved] = useState(false) // Флаг таймаута оппонента

  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardsData, setRewardsData] = useState(null)

  const timerRef = useRef(null)
  const pollingInterval = useRef(null)
  const timeoutId = useRef(null)

  const roomId = currentRoom?._id

  // Определяем позицию текущего пользователя 
  const isSpeakerA = currentRoom?.userA === currentUserId
  const mySide = isSpeakerA
    ? currentRoom?.topic?.sideA
    : currentRoom?.topic?.sideB

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Логика переключения раундов по таймеру
          if (currentRound === 'intro') {
            setCurrentRound('speakerA')
            return 5 // 2 минуты для Спикера А
          } else if (currentRound === 'speakerA') {
            setCurrentRound('speakerB')
            return 5 // 2 минуты для Спикера Б
          } else if (currentRound === 'speakerB') {
            setCurrentRound('blitz')
            return 3 // 1 минута на блиц-вопросы
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


  // 2. Эффект взаимного пуллинга оценок после нашего голосования
  useEffect(() => {
    // Начинаем проверку, только если мы отправили/пропустили оценку, комната валидна и оппонент не ИИ
    if (isRatingSubmitted && roomId && !currentRoom?.isAiBot) {
      
      // Запускаем интервал запросов каждые 2.5 секунды
      pollingInterval.current = setInterval(() => {
        dispatch(fetchCheckRatingStatus(roomId))
      }, 2500)

      // Ограничиваем время ожидания до 15 секунд, чтобы юзер не залип на экране
      timeoutId.current = setTimeout(() => {
        clearInterval(pollingInterval.current)
        setIsOpponentLeaved(true) // Оппонент закрыл вкладку или пропустил оценку
      }, 15000)
    }

    // Если оценка от оппонента успешно пришла в стейт, очищаем таймеры раньше срока
    if (opponentRating !== null) {
      clearInterval(pollingInterval.current)
      clearTimeout(timeoutId.current)
    }

    return () => {
      clearInterval(pollingInterval.current)
      clearTimeout(timeoutId.current)
    }
  }, [isRatingSubmitted, opponentRating, roomId, currentRoom, dispatch])

  // Форматирование времени в формат ММ:СС
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Возвращает понятный текст текущего статуса дискуссии
  const getRoundTitle = () => {
    switch (currentRound) {
      case 'intro':
        return '🤝 Знакомство и подготовка'
      case 'speakerA':
        return '📢 Монолог Спикера А'
      case 'speakerB':
        return '📢 Монолог Спикера Б'
      case 'blitz':
        return '⚡ Блиц-раунд (Вопросы)'
      case 'feedback':
        return '🏆 Выставление оценок'
      default:
        return ''
    }
  }

  // Завершение дуэли и начисление наград через Бэкенд
  const handleVoteSubmit = (rating) => {
    if (!currentRoom?._id) return

    setIsVoted(true)

    // Отправляем данные на бэкенд контроллеру submitRating
    dispatch(
      fetchSubmitLiveRating({ roomId: currentRoom._id, rating }),
    )
      .unwrap()
      .then((data) => {
        // Записываем данные наград в стейт и открываем модалку вместо alert
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

  // Метод закрытия модалки и возврата в меню
  const handleCloseModal = () => {
    setShowRewardModal(false)
   
    
  }

   // Финальный выход в меню по кнопке пользователя
  const handleLeaveRoom = () => {
    dispatch(resetLiveDuelState())
    // Здесь при необходимости можно сделать редирект, например: navigate('/dashboard')
  }

  return (
    <div className={styles.duel_room_container}>
      {/* Шапка с таймером */}
      <div className={styles.header_card}>
        <span className={styles.round_badge}>{getRoundTitle()}</span>
        {currentRound !== 'feedback' && (
          <h1 className={styles.timer_display}>
            {formatTime(timeLeft)}
          </h1>
        )}
      </div>

      {/* Карточка темы */}
      <div className={styles.topic_card}>
        <h3 className={styles.topic_label}>Тема дискуссии:</h3>
        <h2 className={styles.topic_title}>
          «{currentRoom?.topic?.title}»
        </h2>
        <div className={styles.my_position_box}>
          Ваша позиция:{' '}
          <strong className={styles.side_highlight}>{mySide}</strong>
        </div>
      </div>

      {/* Экран активных раундов общения */}
      {currentRound !== 'feedback' && (
        <div className={styles.action_block}>
          {/* Индикатор, чья сейчас очередь говорить */}
          <div className={styles.turn_indicator}>
            {currentRound === 'speakerA' && (
              <p
                className={
                  isSpeakerA ? styles.your_turn : styles.opponent_turn
                }
              >
                {isSpeakerA
                  ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.'
                  : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
              </p>
            )}
            {currentRound === 'speakerB' && (
              <p
                className={
                  !isSpeakerA
                    ? styles.your_turn
                    : styles.opponent_turn
                }
              >
                {!isSpeakerA
                  ? '👉 СЕЙЧАС ВАШ ХОД! Говорите аргументированно.'
                  : '⏳ Слушайте оппонента и фиксируйте контраргументы.'}
              </p>
            )}
            {currentRound === 'blitz' && (
              <p className={styles.blitz_turn}>
                🔥 Свободная дискуссия! Задавайте вопросы и отвечайте
                взаимно.
              </p>
            )}
          </div>

          {/* Главная кнопка перехода в ВК звонок (адаптирована под vkCallLink) */}
          <a
            href={currentRoom?.vkCallLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.vk_call_btn}
          >
            📞 Открыть VK Звонок
          </a>
          <p className={styles.vk_hint}>
            Звонок откроется в официальном приложении VK. Вернитесь
            сюда, чтобы следить за таймером раундов.
          </p>
        </div>
      )}

       {/* Экран взаимного оценивания (Финиш) */}
      {currentRound === 'feedback' && (
        <div className={styles.feedback_block}>
          {!isVoted ? (
            <>
              <h3 className={styles.feedback_title}>
                Как справился ваш оппонент?
              </h3>
              <p className={styles.feedback_description}>
                Оцените культуру речи, силу аргументов и убедительность собеседника:
              </p>

              <div className={styles.rating_buttons}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    disabled={loading}
                    className={styles.rating_btn}
                    onClick={() => handleVoteSubmit(num)}
                  >
                    {num} ⭐
                  </button>
                ))}
              </div>

              {/* Кнопка добровольного пропуска оценивания оппонента */}
              <button
                disabled={loading}
                className={styles.skip_btn}
                onClick={() => handleVoteSubmit(null)}
              >
                Пропустить оценку
              </button>
            </>
          ) : (
            <div className={styles.success_vote}>
              {/* Логика отображения статуса взаимной оценки */}
              {currentRoom?.isAiBot ? (
                <p>🤖 Тренировка с ИИ успешно завершена.</p>
              ) : opponentRating !== null ? (
                <div className={styles.opponent_rating_info}>
                  <h3>Оппонент оценил ваше выступление на:</h3>
                  <div className={styles.stars_display}>{opponentRating} из 5 ⭐</div>
                </div>
              ) : isOpponentLeaved ? (
                <p className={styles.muted_text}>Собеседник решил не оставлять оценку или покинул комнату.</p>
              ) : (
                <div className={styles.loader_box}>
                  <div className={styles.spinner}></div>
                  <p>Ожидаем взаимную оценку от оппонента...</p>
                </div>
              )}

              {/* Кнопка выхода в меню, доступная пользователю всегда */}
              <button className={styles.leave_room_btn} onClick={handleLeaveRoom}>
                Вернуться в меню
              </button>
            </div>
          )}
        </div>
      )}

      {showRewardModal && rewardsData && (
        <LiveRoomRewardModal
          data={rewardsData}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default LiveRoomReal