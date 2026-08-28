import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  resetLiveDuelState,
  setSearchStatus,
} from '../../../redux/slices/liveDuelSlice'

import LiveDuelSelection from './live-duel-selection/LiveDuelSelection'
import LiveDuelMatching from './live-duel-matching/LiveDuelMatching'
import LiveDuelLinkWaiting from './live-duel-link-waiting/LiveDuelLinkWaiting'
import LiveRoomReal from './live-room-real/LiveRoomReal'
import LiveRoomAi from './live-room-ai/LiveRoomAi'
import LiveDuelCreateSlot from './live-duel-create-slot/LiveDuelCreateSlot'
import LiveDuelSlotsList from './live-duel-slots-list/LiveDuelSlotsList'
import styles from './LiveDuelContainer.module.css'

const LiveDuelContainer = () => {
  const dispatch = useDispatch()
  const { searchStatus, currentRoom } = useSelector(
    (state) => state.liveDuel,
  )

  // СИНХРОНИЗАЦИЯ: Если мы были в поиске, но пуллинг обновил статус комнаты в базе на 'active'
  useEffect(() => {
    if (
      searchStatus === 'searching' &&
      currentRoom?.status === 'active'
    ) {
      console.log(
        '=== СИНХРОНИЗАЦИЯ: Оппонент найден! Переключаем на игру ===',
      )
      dispatch(setSearchStatus('active'))
    }
  }, [currentRoom?.status, searchStatus, dispatch])

  // Очищаем состояние дуэлей при выходе пользователя с этого экрана
  useEffect(() => {
    return () => {
      dispatch(resetLiveDuelState())
    }
  }, [dispatch])

  // Функция для принудительного возврата на стартовый экран
  const handleBackToMenu = () => {
    dispatch(resetLiveDuelState())
  }

  // Проверяем, находится ли пользователь НЕ на главном экране
  // (чтобы кнопка возврата не дублировалась на стартовой странице)
  const showBackButton = searchStatus !== 'idle'

  // Фабрика рендеринга экранов в зависимости от статуса матчмейкинга
  const renderCurrentScreen = () => {
    switch (searchStatus) {
      case 'idle':
      case 'failed':
        return <LiveDuelSelection />
      case 'searching':
        return <LiveDuelMatching />
      case 'link_waiting':
        return <LiveDuelLinkWaiting room={currentRoom} />
      case 'slot_create':
        return <LiveDuelCreateSlot />
      case 'slots_list':
        return <LiveDuelSlotsList />
      case 'active':
        if (currentRoom?.isAiBot) {
          return <LiveRoomAi />
        }
        return <LiveRoomReal />

      default:
        return <LiveDuelSelection />
    }
  }

  return (
    <div className={styles.container_wrapper}>
      {/* Контрастная кнопка возврата на главный экран */}
      {showBackButton && (
        <div className={styles.back_button_container}>
          <button
            onClick={handleBackToMenu}
            className={styles.back_menu_btn}
          >
            ← Вернуться в главное меню
          </button>
        </div>
      )}
      {renderCurrentScreen()}
    </div>
  )
}

export default LiveDuelContainer
