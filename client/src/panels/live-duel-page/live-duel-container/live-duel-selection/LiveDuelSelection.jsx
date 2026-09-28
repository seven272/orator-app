import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FiZap, FiLink } from 'react-icons/fi'
import { LuSwords } from 'react-icons/lu'
import {
  fetchCreateLiveRoom,
  fetchJoinLiveRoom,
} from '../../../../redux/slices/liveDuelSlice'
import styles from './LiveDuelSelection.module.css'

const LiveDuelSelection = () => {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.liveDuel)

  const handleQuickSearch = () => {
    dispatch(fetchJoinLiveRoom({}))
      .unwrap()
      .then((res) => {
        if (res.room) {
          console.log('Успешно подключились к существующей комнате:', res.room._id)
        } else {
          dispatch(fetchCreateLiveRoom({ creationType: 'quick_search' }))
        }
      })
      .catch((err) => {
        console.error('Ошибка быстрого поиска:', err)
      })
  }

  const handleDirectLink = () => {
    dispatch(fetchCreateLiveRoom({ creationType: 'direct_link' }))
  }

  return (
    <div className={styles.selection_container}>
      <h1 className={styles.main_title}>
        Голосовые Баттлы <LuSwords className={styles.vk_icon} />
      </h1>
      
      <p className={styles.main_description}>
        Парные поединки по ораторскому искусству с живыми людьми.
        Бросайте вызов оппонентам в удобном формате аудиосообщений, 
        защищайте свои убеждения и прокачивайте харизму не выходя из чата.
      </p>

      {error && <div className={styles.error_banner}>{error}</div>}

      <div className={styles.menu_list}>
        {/* Кнопка быстрого поиска */}
        <button
          className={styles.menu_button_primary}
          onClick={handleQuickSearch}
          disabled={loading}
        >
          <div className={styles.btn_icon_wrapper}>
            <FiZap className={styles.btn_icon_flash} />
          </div>
          <div className={styles.btn_content}>
            <span className={styles.btn_title}>
              {loading ? 'Инициализация...' : 'Быстро найти пару'}
            </span>
            <span className={styles.btn_description}>
              Поединок со случайным пользователем, который тоже в поиске партнера прямо сейчас.
            </span>
          </div>
        </button>

        {/* Кнопка создания инвайта */}
        <button
          className={styles.menu_button_secondary}
          onClick={handleDirectLink}
          disabled={loading}
        >
          <div className={styles.btn_icon_wrapper}>
            <FiLink className={styles.btn_icon} />
          </div>
          <div className={styles.btn_content}>
            <span className={styles.btn_title}>Создать ссылку-приглашение</span>
            <span className={styles.btn_description}>
              Отправьте вызов другу или знакомому. Для участия он должен иметь аккаунт оратора.
            </span>
          </div>
        </button>
      </div>
    </div>
  )
}

export default LiveDuelSelection

