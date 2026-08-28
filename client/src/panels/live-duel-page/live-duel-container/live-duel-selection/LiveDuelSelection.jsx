import React from 'react'
import { useDispatch, useSelector } from 'react-redux'

import {
  fetchCreateLiveRoom,
  fetchJoinLiveRoom,
  setSearchStatus,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelSelection.module.css'

const LiveDuelSelection = () => {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.liveDuel)

  const handleQuickSearch = () => {
    // 1. Сначала пробуем подключиться к кому-то
    dispatch(fetchJoinLiveRoom({}))
      .unwrap()
      .then((res) => {
        // 2. Если комната нашлась (Игрок Б успешно зашел к Игроку А)
        if (res.room) {
          // Редюсер fetchJoinLiveRoom сам переведет searchStatus в 'active',
          // и контейнер сразу откроет экран игры LiveRoomReal
          console.log(
            'Успешно подключились к существующей комнате:',
            res.room._id,
          )
        } else {
          // 3. Если свободных комнат нет (res.room === null) — создаем свою
          dispatch(
            fetchCreateLiveRoom({ creationType: 'quick_search' }),
          )
          // После fetchCreateLiveRoom стейт получит статус 'searching'
          // и запишет созданную комнату в currentRoom. Больше ничего дергать не нужно!
        }
      })
      .catch((err) => {
        console.error('Ошибка быстрого поиска:', err)
      })
  }

  const handleDirectLink = () => {
    dispatch(fetchCreateLiveRoom({ creationType: 'direct_link' }))
  }

  // Нажатие на кнопку "Запланировать дуэль"
  const handleGoFormCreateSlot = () => {
    dispatch(setSearchStatus('slot_create'))
  }

  // Нажатие на кнопку "Найти слот"
  const handleGoCalendar = () => {
    dispatch(setSearchStatus('slots_list'))
  }

  return (
    <div className={styles.selection_container}>
      <h1 className={styles.main_title}>🎙️ Живые Дуэли</h1>
      <p className={styles.main_description}>
        Практикуйте ораторское мастерство с реальными людьми или
        ИИ-тренером в режиме реального времени.
      </p>

      {error && <div className={styles.error_banner}>{error}</div>}

      <div className={styles.menu_list}>
        <button
          className={styles.menu_button_primary}
          onClick={handleQuickSearch}
          disabled={loading}
        >
          {loading ? 'Инициализация...' : '⚡ Быстрый поиск пары'}
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleDirectLink}
          disabled={loading}
        >
          🔗 Создать ссылку-приглашение
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleGoFormCreateSlot}
          disabled={loading}
        >
          📅 Запланировать дуэль
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleGoCalendar}
          disabled={loading}
        >
          🔍 Найти дуэль
        </button>
      </div>
    </div>
  )
}
export default LiveDuelSelection
