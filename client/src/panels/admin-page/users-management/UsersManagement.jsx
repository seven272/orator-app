import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import UserModal from './user-modal/UserModal.jsx'
import {
  fetchToggleUserPremium,
  fetchAdminUsers,
} from '../../../redux/slices/adminSlice.js'
import styles from './UsersManagement.module.css'

const UsersManagement = () => {
  const dispatch = useDispatch()
  const { users, total_pages, current_page } = useSelector(
    (state) => state.admin,
  )

  const [search_query, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selected_user, setSelectedUser] = useState(null)

  useEffect(() => {
    dispatch(fetchAdminUsers({ page, search: search_query }))
  }, [dispatch, page, search_query])

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    setPage(1)
  }

  const handlePremiumToggle = async (user_id) => {
    try {
      const result = await dispatch(
        fetchToggleUserPremium(user_id),
      ).unwrap()
      // Обновляем локальный стейт открытой модалки, чтобы кнопка сразу поменяла цвет
      setSelectedUser((prev) =>
        prev ? { ...prev, isPremium: result.isPremium } : null,
      )
    } catch (err) {
      alert(err || 'Не удалось изменить статус')
    }
  }

  return (
    <div className={styles.users_wrapper}>
      {/* Блок поиска */}
      <div className={styles.search_container}>
        <input
          type="text"
          placeholder="Поиск по имени или ID..."
          className={styles.search_input}
          value={search_query}
          onChange={handleSearchChange}
        />
      </div>

      {/* Список */}
      <div className={styles.user_list_section}>
        <h2 className={styles.section_title}>
          Управление пользователями
        </h2>

        {users.length === 0 ? (
          <div className={styles.empty_message}>
            Никого не найдено
          </div>
        ) : (
          users.map((user) => (
            <div
              key={user._id}
              className={styles.user_item}
              onClick={() => setSelectedUser(user)}
            >
              <div className={styles.user_info_main}>
                <span className={styles.user_name}>
                  {user.displayName || 'Без имени'}
                  {user.isPremium && (
                    <span className={styles.user_badge_premium}>
                      PREMIUM
                    </span>
                  )}
                </span>
                <span className={styles.user_meta_sub}>
                  {user.email || 'Вход через соцсети'}
                </span>
              </div>
              <div className={styles.row_meta}>
                <div>Lvl {user.progression?.level || 1}</div>
                <div className={styles.xp_sub}>
                  {user.stats?.lifetimeXp || 0} XP
                </div>
              </div>
            </div>
          ))
        )}

        {/* Пагинация */}
        {total_pages > 1 && (
          <div className={styles.pagination_container}>
            <button
              className={styles.page_btn}
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              ◀ Назад
            </button>
            <span className={styles.page_info}>
              Стр. {current_page} из {total_pages}
            </span>
            <button
              className={styles.page_btn}
              disabled={page === total_pages}
              onClick={() =>
                setPage((prev) => Math.min(prev + 1, total_pages))
              }
            >
              Вперед ▶
            </button>
          </div>
        )}
      </div>

      {/* Вынесенный компонент модального окна */}
      {selected_user && (
        <UserModal
          user={selected_user}
          currentPage={page}
          searchQuery={search_query}
          onClose={() => setSelectedUser(null)}
          onTogglePremium={handlePremiumToggle}
        />
      )}
    </div>
  )
}

export default UsersManagement
