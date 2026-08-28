// users-management/UserModal.jsx
import React from 'react'
import { useDispatch } from 'react-redux'
import { fetchDeleteUserById, fetchAdminUsers } from '../../../../redux/slices/adminSlice.js'
import styles from './UserModal.module.css' // Используем те же стили

const UserModal = ({ user, onClose, onTogglePremium, currentPage, searchQuery }) => {
  const dispatch = useDispatch()

  const handleUserDelete = async (user_id) => {
    const isConfirmed = window.confirm(
      'Вы уверены, что хотите НАВСЕГДА удалить этого пользователя и весь его прогресс?'
    )
    
    if (isConfirmed) {
      try {
        await dispatch(fetchDeleteUserById(user_id)).unwrap()
        onClose() // Закрываем модалку после успешного удаления
        // Обновляем текущую страницу списка
        dispatch(fetchAdminUsers({ page: currentPage, search: searchQuery }))
      } catch (err) {
        alert(err || 'Не удалось удалить пользователя')
      }
    }
  }

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div className={styles.modal_content} onClick={(evt) => evt.stopPropagation()}>
        <button className={styles.modal_close_btn} onClick={onClose}>×</button>
        
        <h3 className={styles.modal_title}>Карточка пользователя</h3>
        
        <div className={styles.detail_row}>
          <span>Имя:</span>
          <strong>{user.displayName || 'Без имени'}</strong>
        </div>
        <div className={styles.detail_row}>
          <span>ID:</span>
          <span className={styles.row_meta_text} style={{ fontSize: '12px' }}>
            {user._id}
          </span>
        </div>
          <div className={styles.detail_row}>
          <span>Текущий уровень:</span>
          <strong>Lvl {user.progression?.level || 1}</strong>
        </div>
        <div className={styles.detail_row}>
          <span>Баланс жетонов:</span>
          <strong>{user.progression?.coins || 0} 🪙</strong>
        </div>
        <div className={styles.detail_row}>
          <span>Глобальный опыт (Lifetime):</span>
          <strong>{user.stats?.lifetimeXp || 0} XP</strong>
        </div>
        <div className={styles.detail_row}>
          <span>Статус:</span>
          <strong>{user.isPremium ? '💎 Premium активен' : '⏸️ Обычный доступ'}</strong>
        </div>

        {/* Кнопка изменения статуса */}
        <button 
          className={`${styles.premium_action_btn} ${user.isPremium ? styles.btn_revoke : styles.btn_grant}`}
          onClick={() => onTogglePremium(user._id)}
        >
          {user.isPremium ? 'Забрать Premium' : 'Выдать Premium'}
        </button>

        {/* Кнопка критического удаления */}
        <button 
          className={styles.delete_action_btn}
          onClick={() => handleUserDelete(user._id)}
        >
          ❌ Удалить аккаунт навсегда
        </button>
      </div>
    </div>
  )
}

export default UserModal
