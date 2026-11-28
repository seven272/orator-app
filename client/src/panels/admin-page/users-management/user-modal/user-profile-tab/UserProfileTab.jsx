import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchDeleteUserById,
  fetchAdminUsers,
  fetchUpdateUserPremium,
  fetchAdminAddCourse,
  fetchAdminUserDetails,
} from '../../../../../redux/slices/adminSlice.js'

import styles from './UserProfileTab.module.css'

const RANK_TITLES = [
  '🌱 Начинающий',
  '🎙️ Уверенный',
  '🔥 Профи',
  '👑 Мастер',
  '🏆 Легенда',
]

const UserProfileTab = ({
  user,
  availableCourses,
  currentPage,
  searchQuery,
  onClose,
  showAlert,
}) => {
  const dispatch = useDispatch()
  const [selectedDuration, setSelectedDuration] = useState('1m')
  const [selectedCourse, setSelectedCourse] = useState(
    availableCourses[0]?.code || ''
  )
  const [actionLoading, setActionLoading] = useState(false)

  const getSourceLabel = (src) => {
    if (src === 'vk') return '🌐 Приложение ВКонтакте'
    if (src === 'android') return '📱 Android Клиент'
    return '💻 Независимый сайт'
  }

  const formatDate = (isoDate) => {
    if (!isoDate) return '—'
    return new Date(isoDate).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handlePremiumSubmit = async (mode) => {
    setActionLoading(true)
    const duration = mode === 'grant' ? selectedDuration : 'revoke'
    try {
      await dispatch(
        fetchUpdateUserPremium({ userId: user._id, duration })
      ).unwrap()
      showAlert(
        mode === 'grant'
          ? '💎 Premium статус успешно начислен!'
          : '⏸️ Premium статус успешно отозван!',
        'success'
      )
      dispatch(fetchAdminUsers({ page: currentPage, search: searchQuery }))
      dispatch(fetchAdminUserDetails(user._id))
    } catch (err) {
      showAlert(err || 'Ошибка изменения статуса', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddCourseSubmit = async () => {
    if (user.activePurchasedCourses?.includes(selectedCourse)) {
      return showAlert('⚠️ Этот интенсив уже открыт для пользователя', 'warning')
    }
    setActionLoading(true)
    try {
      await dispatch(
        fetchAdminAddCourse({
          userId: user._id,
          courseCode: selectedCourse,
        })
      ).unwrap()
      showAlert('🎓 Доступ к интенсиву успешно предоставлен!', 'success')
      dispatch(fetchAdminUsers({ page: currentPage, search: searchQuery }))
      dispatch(fetchAdminUserDetails(user._id))
    } catch (err) {
      showAlert(err || 'Не удалось добавить курс', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserDelete = async () => {
    const isConfirmed = window.confirm(
      'Вы уверены, что хотите НАВСЕГДА удалить этого пользователя?'
    )
    if (isConfirmed) {
      try {
        await dispatch(fetchDeleteUserById(user._id)).unwrap()
        onClose()
        dispatch(fetchAdminUsers({ page: currentPage, search: searchQuery }))
      } catch (err) {
        showAlert(err || 'Не удалось удалить пользователя', 'error')
      }
    }
  }

  const rankIndex = user.progression?.speakerRank ?? 0
  const rankLabel = RANK_TITLES[rankIndex] || `Ранг ${rankIndex}`

  return (
    <div className={styles.tab_wrap}>
      {/* Компактная сетка ключевых метрик активности */}
      <div className={styles.metrics_grid}>
        <div className={styles.metric_box}>
          <span className={styles.metric_label}>Уровень / Опыт</span>
          <strong className={styles.metric_val}>
            Lvl {user.progression?.level || 1} ({user.stats?.lifetimeXp || 0} XP)
          </strong>
        </div>

        <div className={styles.metric_box}>
          <span className={styles.metric_label}>Ранг оратора</span>
          <strong className={styles.metric_val}>{rankLabel}</strong>
        </div>

        <div className={styles.metric_box}>
          <span className={styles.metric_label}>Жетоны / Стрик</span>
          <strong className={styles.metric_val}>
            {user.progression?.coins || 0} 🪙 · {user.streak?.current || 0} дн.
          </strong>
        </div>

        <div className={styles.metric_box}>
          <span className={styles.metric_label}>Упражнений / Неделя</span>
          <strong className={styles.metric_val}>
            {user.stats?.totalExercises || 0} шт. · {user.weeklyXp || 0} XP
          </strong>
        </div>
      </div>

      {/* Служебная информация об аккаунте */}
      <div className={styles.detail_row}>
        <span>Имя / Email:</span>
        <strong>
          {user.displayName || 'Без имени'}
          {user.email ? ` (${user.email})` : ''}
        </strong>
      </div>
      <div className={styles.detail_row}>
        <span>Источник регистрации:</span>
        <strong>{getSourceLabel(user.registeredFrom)}</strong>
      </div>
      <div className={styles.detail_row}>
        <span>VK ID / ID системы:</span>
        <span className={styles.row_meta_text}>
          {user.vkId ? `vk:${user.vkId} · ` : ''}
          {user._id}
        </span>
      </div>
      <div className={styles.detail_row}>
        <span>Дата регистрации:</span>
        <strong>{formatDate(user.createdAt)}</strong>
      </div>
      <div className={styles.detail_row}>
        <span>Последняя активность:</span>
        <strong>
          {formatDate(user.streak?.lastCompletedDate || user.updatedAt)}
        </strong>
      </div>

      {/* Активные курсы тегами */}
      <div className={styles.courses_section}>
        <span className={styles.section_subtitle}>Открытые курсы:</span>
        <div className={styles.course_tags_wrapper}>
          {!user.activePurchasedCourses?.length ? (
            <span className={styles.empty_tags_text}>Нет купленных курсов</span>
          ) : (
            user.activePurchasedCourses.map((code) => (
              <span key={code} className={styles.course_badge_tag}>
                {availableCourses.find((c) => c.code === code)?.title || code}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Управление Premium */}
      <div className={styles.admin_control_block}>
        <span className={styles.control_label_title}>
          💎 Управление Premium статусом
        </span>
        <div
          className={styles.detail_row}
          style={{ border: 'none', padding: '4px 0' }}
        >
          <span>Статус сейчас:</span>
          <strong>
            {user.isPremium
              ? `Активен до: ${
                  user.premiumExpiresAt
                    ? formatDate(user.premiumExpiresAt)
                    : 'бессрочно'
                }`
              : 'Не активен'}
          </strong>
        </div>

        {!user.isPremium ? (
          <div className={styles.control_action_row}>
            <select
              className={styles.admin_select_input}
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              disabled={actionLoading}
            >
              <option value="1h">1 час</option>
              <option value="1m">1 месяц</option>
              <option value="6m">6 месяцев</option>
              <option value="1y">1 год</option>
            </select>
            <button
              className={`${styles.action_submit_btn} ${styles.btn_grant}`}
              onClick={() => handlePremiumSubmit('grant')}
              disabled={actionLoading}
            >
              Выдать
            </button>
          </div>
        ) : (
          <button
            className={`${styles.premium_revoke_full_btn} ${styles.btn_revoke}`}
            onClick={() => handlePremiumSubmit('revoke')}
            disabled={actionLoading}
          >
            Забрать Premium статус
          </button>
        )}
      </div>

      {/* Ручная выдача курсов */}
      <div className={styles.admin_control_block}>
        <span className={styles.control_label_title}>
          🎓 Открыть доступ к интенсиву
        </span>
        <div className={styles.control_action_row}>
          <select
            className={styles.admin_select_input}
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            disabled={actionLoading}
          >
            {availableCourses.map((course) => (
              <option key={course.code} value={course.code}>
                {course.title}
              </option>
            ))}
          </select>
          <button
            className={`${styles.action_submit_btn} ${styles.btn_course_add}`}
            onClick={handleAddCourseSubmit}
            disabled={actionLoading}
          >
            Открыть
          </button>
        </div>
      </div>

      <button
        className={styles.delete_action_btn}
        onClick={handleUserDelete}
        disabled={actionLoading}
      >
        ❌ Удалить аккаунт навсегда
      </button>
    </div>
  )
}

export default UserProfileTab
