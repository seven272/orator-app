import React, { useEffect, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import vkBridge from '@vkontakte/vk-bridge'

import {
  resetLiveDuelState,
  fetchUpdateCallLink,
} from '../../../../redux/slices/liveDuelSlice'

// Импортируем декомпозированные компоненты из соседних папок
import LiveRoomHeader from './live-room-header/LiveRoomHeader'
import LiveRoomTopic from './live-room-topic/LiveRoomTopic'
import LiveRoomPipGuide from './live-room-pip-guide/LiveRoomPipGuide'
import LiveRoomFeedback from './live-room-feedback/LiveRoomFeedback'
import LiveRoomRewardModal from './live-room-reward-modal/LiveRoomRewardModal'

import styles from './LiveRoomReal.module.css'

const LiveRoomReal = () => {
  const dispatch = useDispatch()

  const { currentRoom } = useSelector((state) => state.liveDuel)
  const currentUserId = useSelector(
    (state) => state.profile?.user?._id || state.auth?.user?._id,
  )

  // БОЕВЫЕ ТАЙМЕРЫ (в секундах): intro (30с), monologues (120с), blitz (60с)
  const ROUND_TIMES = {
    intro: 3,
    speakerA: 12,
    speakerB: 12,
    blitz: 6,
    feedback: 0,
  }

  const [currentRound, setCurrentRound] = useState('intro')
  const [timeLeft, setTimeLeft] = useState(ROUND_TIMES.intro)

  const [showRewardModal, setShowRewardModal] = useState(false)
  const [rewardsData, setRewardsData] = useState(null)

  const timerRef = useRef(null)
  const roomId = currentRoom?._id

  const callInitiatedRef = useRef(false)

  // Определение роли текущего оратора
  const isSpeakerA = currentRoom?.userA === currentUserId
  const mySide = isSpeakerA
    ? currentRoom?.topic?.sideA
    : currentRoom?.topic?.sideB

  // 1. Управление жизненным циклом таймеров раундов
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

  useEffect(() => {
    // --- Слушатель событий завершения звонка ---
    const handleBridgeEvents = (e) => {
      const { type, data } = e.detail
      console.log(`[QA] VK Bridge event: ${type}`, data)

      if (
        type === 'VKWebAppCallLeft' ||
        type === 'VKWebAppCallFinished'
      ) {
        console.log(
          `[QA] Call ended via ${type}. Switching to feedback.`,
        )
        setCurrentRound('feedback')
      }
    }

    vkBridge.subscribe(handleBridgeEvents)

    // --- Инициация звонка для Speaker A (один раз) ---
    if (
      isSpeakerA &&
      !currentRoom?.vkCallLink &&
      !callInitiatedRef.current
    ) {
      callInitiatedRef.current = true
      console.log('[QA] Speaker A: initiating VKWebAppCallStart...')

      if (!vkBridge.supports('VKWebAppCallStart')) {
        console.error(
          '[QA] Platform does not support VKWebAppCallStart',
        )
        return
      }

      vkBridge
        .send('VKWebAppCallStart', {})
        .then((data) => {
          console.log('[QA] VKWebAppCallStart success:', data)

          const joinLink = data.join_link
          if (joinLink) {
            dispatch(
              fetchUpdateCallLink({
                roomId: currentRoom._id,
                vkCallLink: joinLink, // ← сохраняем join_link
                vkCallId: data.call_id || '',
              }),
            )
              .unwrap()
              .then((res) =>
                console.log('[QA] Backend saved call link', res),
              )
              .catch((err) =>
                console.error(
                  '[QA] Backend error saving call link',
                  err,
                ),
              )
          } else {
            console.warn('[QA] VK returned empty call_link')
          }
        })
        .catch((err) =>
          console.error(
            '[QA] VK Bridge error on VKWebAppCallStart',
            err,
          ),
        )
    }

    return () => vkBridge.unsubscribe(handleBridgeEvents)
  }, [isSpeakerA, currentRoom?._id, dispatch])

  // 3. Нативный метод старта/подключения к звонку
  const handleOpenVkCall = (evt) => {
  evt.preventDefault()

  if (!currentRoom?.vkCallLink) {
    alert('Звонок ещё создаётся. Подождите пару секунд и попробуйте снова.')
    return
  }

  // Speaker B — подключается через VKWebAppCallJoin
  if (!isSpeakerA) {
    if (!vkBridge.supports('VKWebAppCallJoin')) {
      alert('Ваше приложение не поддерживает звонки. Обновите VK до последней версии.')
      return
    }

    vkBridge
      .send('VKWebAppCallJoin', {
        join_link: currentRoom.vkCallLink,
      })
      .then((data) => {
        console.log('[QA] VKWebAppCallJoin success:', data)
        if (data.result) {
          console.log('[QA] Call join accepted. Check for popup blocker or new tab.')
        }
      })
      .catch((err) => {
        console.error('[QA] VKWebAppCallJoin FAILED:', err)
        if (err.error_data?.error_code === 13) {
          alert('Вы уже в звонке. Закройте предыдущий звонок и попробуйте снова.')
        } else if (err.error_data?.error_code === 11) {
          alert('Нет доступа к микрофону. Разрешите доступ в настройках браузера.')
        } else {
          alert('Не удалось подключиться к звонку. Код: ' + (err.error_data?.error_code || 'unknown'))
        }
      })
    return
  }

  // Speaker A — уже в звонке после VKWebAppCallStart
  if (vkBridge.supports('VKWebAppCallJoin')) {
    vkBridge
      .send('VKWebAppCallJoin', {
        join_link: currentRoom.vkCallLink,
      })
      .catch((err) => console.error('[QA] Speaker A rejoin failed:', err))
  }
}

  const handleCloseRoom = () => {
    dispatch(resetLiveDuelState())
  }

  // Колбэк, который вызывается при успешном голосовании в дочернем компоненте
  const handleVoteSuccess = (data) => {
    setRewardsData(data)
    setShowRewardModal(true) // Показываем модалку!
  }

  const handleCloseModal = () => {
    setShowRewardModal(false)
    dispatch(resetLiveDuelState()) // Очищаем стейт дуэлей и выходим в меню
  }

  return (
    <div className={styles.duel_room_container}>
      {/* Шапка и таймер поединка */}
      <LiveRoomHeader
        currentRound={currentRound}
        timeLeft={timeLeft}
      />

      {/* Карточка текущей темы дискуссии */}
      <LiveRoomTopic topic={currentRoom?.topic} mySide={mySide} />

      {/* Переключение экранов: активная игра / финал с оценками */}
      {currentRound !== 'feedback' ? (
        <LiveRoomPipGuide
          currentRound={currentRound}
          isSpeakerA={isSpeakerA}
          onOpenVkCall={handleOpenVkCall}
        />
      ) : (
        <LiveRoomFeedback
          roomId={roomId}
          currentRoom={currentRoom} // Возвращаем для расчета фолбэков
          onVoteSuccess={handleVoteSuccess}
        />
      )}

      {/* РЕНДЕР МОДАЛКИ: Переносим сюда под управление корневого стейта */}
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
