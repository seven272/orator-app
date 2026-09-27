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

  // 2. Интеграция с нативными звонками и слушателями VK Bridge
  // useEffect(() => {
  //   // Игрок А автоматически инициирует создание звонка при старте комнаты
  //   if (isSpeakerA && !currentRoom?.vkCallLink) {
  //     if (vkBridge.supports('VKWebAppCallStart')) {
  //       vkBridge
  //         .send('VKWebAppCallStart', {})
  //         .then((data) => {
  //           if (data.call_link) {
  //             dispatch(
  //               fetchUpdateCallLink({
  //                 roomId: currentRoom._id,
  //                 vkCallLink: data.call_link,
  //                 vkCallId: data.call_id || '',
  //               }),
  //             )
  //           }
  //         })
  //         .catch((err) => console.error('Ошибка VKWebAppCallStart:', err))
  //     }
  //   }

  //   // Слушатель завершения нативной сессии звонка
  //   const handleBridgeEvents = (e) => {
  //     const { type } = e.detail
  //     if (type === 'VKWebAppCallLeft' || type === 'VKWebAppCallFinished') {
  //       console.log('Поединок завершен на платформе ВК:', type)
  //       setCurrentRound('feedback')
  //     }
  //   }

  //   vkBridge.subscribe(handleBridgeEvents)
  //   return () => vkBridge.unsubscribe(handleBridgeEvents)
  // }, [isSpeakerA, currentRoom?._id, currentRoom?.vkCallLink, dispatch])
  // === ВНУТРИ LiveRoomReal.jsx ===


// TEST START
useEffect(() => {
  // Игрок А: логируем попытку и результат вызова VKWebAppCallStart
  if (isSpeakerA && !currentRoom?.vkCallLink) {
    console.log('%c[QA TEST] Игрок А: Инициализация VKWebAppCallStart...', 'color: #007aff; font-weight: bold;');
    
    if (vkBridge.supports('VKWebAppCallStart')) {
      vkBridge
        .send('VKWebAppCallStart', {})
        .then((data) => {
          console.log('%c[QA TEST] VKWebAppCallStart УСПЕХ. Полученные данные:', 'color: #34c759; font-weight: bold;', data);
          
          if (data.call_link) {
            console.log(`%c[QA TEST] Отправка ссылки звонка на бэкенд для комнаты: ${currentRoom._id}`, 'color: #ffbd12;');
            
            // Логируем сам сетевой запрос через Thunk
            dispatch(fetchUpdateCallLink({
              roomId: currentRoom._id,
              vkCallLink: data.call_link,
              vkCallId: data.call_id || ''
            }))
            .unwrap()
            .then((res) => {
              console.log('%c[QA TEST] Бэкенд УСПЕШНО сохранил ссылку в MongoDB:', 'color: #34c759;', res);
            })
            .catch((backendErr) => {
              console.error('%c[QA TEST] КРИТИЧЕСКАЯ ОШИБКА БЭКЕНДА при сохранении ссылки:', 'color: #f30404; font-weight: bold;', backendErr);
            });
          } else {
            console.warn('%c[QA TEST] ПРЕДУПРЕЖДЕНИЕ: VK вернул пустой call_link!', 'color: #ffbd12;');
          }
        })
        .catch((err) => {
          console.error('%c[QA TEST] ОШИБКА VK BRIDGE при вызове VKWebAppCallStart:', 'color: #f30404; font-weight: bold;', err);
        });
    } else {
      console.error('%c[QA TEST] ОШИБКА: Платформа не поддерживает VKWebAppCallStart!', 'color: #f30404;');
    }
  }

  // Слушатель событий завершения звонка со стороны ВК
  const handleBridgeEvents = (e) => {
    const { type, data } = e.detail;
    // Логируем абсолютно все входящие события от Bridge для отладки
    console.log(`%c[QA TEST] Получено событие от VK Bridge: ${type}`, 'color: #8e9bae;', data);
    
    if (type === 'VKWebAppCallLeft' || type === 'VKWebAppCallFinished') {
      console.log(`%c[QA TEST] Триггер финала запущен событием: ${type}. Переключаем раунд на feedback.`, 'color: #ff89bb; font-weight: bold;');
      setCurrentRound('feedback');
    }
  };

  vkBridge.subscribe(handleBridgeEvents);
  return () => vkBridge.unsubscribe(handleBridgeEvents);
}, [isSpeakerA, currentRoom?._id, currentRoom?.vkCallLink, dispatch]);
// TEST FINISH

  // 3. Нативный метод старта/подключения к звонку
  const handleOpenVkCall = (evt) => {
    evt.preventDefault()

    if (!currentRoom?.vkCallLink) {
      alert('Синхронизация звонка оппонентом, пожалуйста, подождите...')
      return
    }

    if (!isSpeakerA && vkBridge.supports('VKWebAppCallJoin')) {
      vkBridge
        .send('VKWebAppCallJoin', {
          call_link: currentRoom.vkCallLink,
        })
        .catch((err) => {
          console.error('Ошибка VKWebAppCallJoin, фолбэк на OpenURL:', err)
          vkBridge.send('VKWebAppOpenURL', { url: currentRoom.vkCallLink })
        })
    } else {
      if (vkBridge.supports('VKWebAppOpenURL')) {
        vkBridge.send('VKWebAppOpenURL', { url: currentRoom.vkCallLink })
      } else {
        window.open(currentRoom.vkCallLink, '_blank', 'noopener,noreferrer')
      }
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
      <LiveRoomHeader currentRound={currentRound} timeLeft={timeLeft} />

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
      <LiveRoomRewardModal data={rewardsData} onClose={handleCloseModal} />
    )}
    </div>
  )
}

export default LiveRoomReal
