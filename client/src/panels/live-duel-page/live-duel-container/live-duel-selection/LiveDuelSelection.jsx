import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiZap, FiLink, FiCalendar, FiSearch } from 'react-icons/fi'
import { FaVk } from 'react-icons/fa'
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
          console.log(
            'Успешно подключились к существующей комнате:',
            res.room._id,
          )
        } else {
          // 3. Если свободных комнат нет (res.room === null) — создаем свою
          dispatch(
            fetchCreateLiveRoom({ creationType: 'quick_search' }),
          )
        }
      })
      .catch((err) => {
        console.error('Ошибка быстрого поиска:', err)
      })
  }

  const handleDirectLink = () => {
    dispatch(fetchCreateLiveRoom({ creationType: 'direct_link' }))
  }

  const handleGoFormCreateSlot = () => {
    dispatch(setSearchStatus('slot_create'))
  }

  const handleGoCalendar = () => {
    dispatch(setSearchStatus('slots_list'))
  }

  return (
    <div className={styles.selection_container}>
      <h1 className={styles.main_title}>
        Видео Дуэли <FaVk className={styles.vk_icon} />
      </h1>
      <p className={styles.main_description}>
        Парные поединки по ораторскому искусству внутри ВКонтакте.
        Бросайте вызов сильнейшим оппонентам, защищайте свои убеждения
        и прокачивайте харизму в живом диалоге.
      </p>

      {error && <div className={styles.error_banner}>{error}</div>}

      <div className={styles.menu_list}>
        <button
          className={styles.menu_button_primary}
          onClick={handleQuickSearch}
          disabled={loading}
        >
          <FiZap className={styles.btn_icon_flash} />
          <span>
            {loading ? 'Инициализация...' : 'Быстрый поиск пары'}
          </span>
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleDirectLink}
          disabled={loading}
        >
          <FiLink className={styles.btn_icon} />
          <span>Создать ссылку-приглашение</span>
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleGoFormCreateSlot}
          disabled={loading}
        >
          <FiCalendar className={styles.btn_icon} />
          <span>Запланировать встречу</span>
        </button>

        <button
          className={styles.menu_button_secondary}
          onClick={handleGoCalendar}
          disabled={loading}
        >
          <FiSearch className={styles.btn_icon} />
          <span>Расписание поединков</span>
        </button>
      </div>
    </div>
  )
}

export default LiveDuelSelection
