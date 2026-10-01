import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import {
  fetchDeleteUserById,
  fetchAdminUsers,
  fetchUpdateUserPremium,
  fetchAdminAddCourse,
} from '../../../../redux/slices/adminSlice.js'
import styles from './UserModal.module.css'




const AVAILABLE_COURSES = [
  { code: 'pitch_master', title: 'Питч на миллион' },
  {
    code: 'self_pitch_pro',
    title: 'Личный бренд: самопрезентация на миллион',
  },
  { code: 'hr_storm', title: 'HR Шторм' },
  {
    code: 'party_charisma',
    title: 'Харизма нетворкинга: свой в любой компании',
  },
  {
    code: 'social_shield',
    title: 'Психологический щит: ответ на агрессию и манипуляции',
  },
  {
    code: 'media_speaker',
    title: 'Оратор в кадре: магия публичных выступлений',
  },
  {
    code: 'toast_master',
    title: 'Король застолья: искусство тостов и ярких речей',
  },
  {
    code: 'story_master',
    title: 'Магия истории: искусство увлекательного рассказа',
  },
  {
    code: 'compliment_pro',
    title: 'Сила комплимента: искусство располагать к себе',
  },
  {
    code: 'qa_master',
    title: 'Искусство ответов: как не теряться на публике',
  },
  {
    code: 'question_architect',
    title: 'Гуру вопросов: как управлять беседой',
  },
 
]

const UserModal = ({
  activeModal,
  user,
  onClose,
  currentPage,
  searchQuery,
}) => {

  const dispatch = useDispatch()
  // Локальные стейты для селекторов
  const [selectedDuration, setSelectedDuration] =
    useState('not_selected')
  const [selectedCourse, setSelectedCourse] = useState(
    AVAILABLE_COURSES[0].code,
  )
  const [actionLoading, setActionLoading] = useState(false)
   const [alertInfo, setAlertInfo] = useState(null)



  // Вспомогательная функция вызова уведомления
  const showAlert = (text, type = 'success') => {
    setAlertInfo({ text, type })
  }

  // 1. Обработка изменения Премиума
  const handlePremiumSubmit = async (mode) => {
    setActionLoading(true)
    const duration = mode === 'grant' ? selectedDuration : 'revoke'
    try {
      await dispatch(
        fetchUpdateUserPremium({ userId: user._id, duration }),
      ).unwrap()
    showAlert(mode === 'grant' ? '💎 Premium статус успешно начислен!' : '⏸️ Premium статус успешно отозван!', 'success')
      dispatch(
        fetchAdminUsers({ page: currentPage, search: searchQuery }),
      )
    } catch (err) {
      showAlert(err || 'Ошибка изменения статуса', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // 2. Обработка добавления курса
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
        }),
      ).unwrap()
      showAlert('🎓 Доступ к интенсиву успешно предоставлен!', 'success')
      dispatch(
        fetchAdminUsers({ page: currentPage, search: searchQuery }),
      )
    } catch (err) {
      showAlert(err || 'Не удалось добавить курс', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserDelete = async () => {
    const isConfirmed = window.confirm(
      'Вы уверены, что хотите НАВСЕГДА удалить этого пользователя?',
    )
    if (isConfirmed) {
      try {
        await dispatch(fetchDeleteUserById(user._id)).unwrap()
        onClose()
        dispatch(
          fetchAdminUsers({ page: currentPage, search: searchQuery }),
        )
      } catch (err) {
        showAlert(err || 'Не удалось удалить пользователя', 'error')
      }
    }
  }

  // Перевод констант источника
  const getSourceLabel = (src) => {
    if (src === 'vk') return '🌐 Приложение ВКонтакте'
    if (src === 'android') return '📱 Android Клиент'
    return '💻 Независимый сайт'
  }

  useEffect(() => {
    document.body.style.overflow = activeModal ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeModal])

  useEffect(() => {
    if (!activeModal) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

     // Автоматическое скрытие уведомления через 4 секунды
  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [alertInfo])
  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(evt) => evt.stopPropagation()}
      >
        <button className={styles.modal_close_btn} onClick={onClose}>
          ×
        </button>
        <h3 className={styles.modal_title}>Карточка пользователя</h3>
          {alertInfo && (
          <div className={`${styles.admin_alert_box} ${styles['alert_' + alertInfo.type]}`}>
            {alertInfo.text}
          </div>
        )}

        {/* НОВЫЕ СЛУЖЕБНЫЕ ПОЛЯ */}
        <div className={styles.detail_row}>
          <span>Платформа регистрации:</span>
          <strong>{getSourceLabel(user.registeredFrom)}</strong>
        </div>
        <div className={styles.detail_row}>
          <span>VK ID:</span>
          <strong>{user.vkId || '—'}</strong>
        </div>

        {/* СТАНДАРТНЫЕ ДАННЫЕ */}
        <div className={styles.detail_row}>
          <span>Имя:</span>
          <strong>{user.displayName || 'Без имени'}</strong>
        </div>
        <div className={styles.detail_row}>
          <span>ID системы:</span>
          <span className={styles.row_meta_text}>{user._id}</span>
        </div>
        <div className={styles.detail_row}>
          <span>Уровень / Опыт:</span>
          <strong>
            Lvl {user.progression?.level || 1} (
            {user.stats?.lifetimeXp || 0} XP)
          </strong>
        </div>

        {/* СПИСОК КУПЛЕННЫХ КУРСОВ В ВИДЕ ТЕГОВ */}
        <div className={styles.courses_section}>
          <span className={styles.section_subtitle}>
            Активные курсы:
          </span>
          <div className={styles.course_tags_wrapper}>
            {user.activePurchasedCourses?.length === 0 ? (
              <span className={styles.empty_tags_text}>
                Нет купленных курсов
              </span>
            ) : (
              user.activePurchasedCourses?.map((code) => (
                <span key={code} className={styles.course_badge_tag}>
                  {AVAILABLE_COURSES.find((c) => c.code === code)
                    ?.title || code}
                </span>
              ))
            )}
          </div>
        </div>

        {/* ПАНЕЛЬ УПРАВЛЕНИЯ PREMIUM */}
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
                ? `Активен до: ${user.premiumExpiresAt ? new Date(user.premiumExpiresAt).toLocaleDateString('ru-RU') : 'бессрочно'}`
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

        {/* ПАНЕЛЬ РУЧНОЙ ВЫДАЧИ КУРСОВ */}
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
              {AVAILABLE_COURSES.map((course) => (
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
    </div>
  )
}

export default UserModal
