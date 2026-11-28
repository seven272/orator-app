import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchAdminUserDetails,
  clearSelectedUserDetails,
} from '../../../../redux/slices/adminSlice.js'

import UserProfileTab from './user-profile-tab/UserProfileTab.jsx'
import UserExercisesTab from './user-exercises-tab/UserExercisesTab.jsx'
import UserPurchasesTab from './user-purchases-tab/UserPurchasesTab.jsx'

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
  const { selectedUserDetails, loadingUserDetails } = useSelector(
    (state) => state.admin
  )

  const [activeTab, setActiveTab] = useState('profile')
  const [alertInfo, setAlertInfo] = useState(null)

  const showAlert = (text, type = 'success') => {
    setAlertInfo({ text, type })
  }

  // Загружаем расширенные данные пользователя при открытии
  useEffect(() => {
    if (activeModal && user?._id) {
      setActiveTab('profile')
      dispatch(fetchAdminUserDetails(user._id))
    }
    return () => {
      dispatch(clearSelectedUserDetails())
    }
  }, [activeModal, user?._id, dispatch])

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
  }, [activeModal, onClose])

  useEffect(() => {
    if (alertInfo) {
      const timer = setTimeout(() => setAlertInfo(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [alertInfo])

  if (!activeModal || !user) return null

  // Объединяем данные из списка с подгруженной детальной карточкой
  const fullUser = selectedUserDetails?.user || user
  const coursesProgress = selectedUserDetails?.coursesProgress || []
  const eventTickets = selectedUserDetails?.eventTickets || []

  return (
    <div className={styles.modal_overlay} onClick={onClose}>
      <div
        className={styles.modal_content}
        onClick={(evt) => evt.stopPropagation()}
      >
        <button className={styles.modal_close_btn} onClick={onClose}>
          ×
        </button>

        <h3 className={styles.modal_title}>
          {fullUser.displayName || 'Карточка пользователя'}
        </h3>

        {alertInfo && (
          <div
            className={`${styles.admin_alert_box} ${
              styles['alert_' + alertInfo.type]
            }`}
          >
            {alertInfo.text}
          </div>
        )}

        {/* Переключатель вкладок внутри карточки */}
        <div className={styles.modal_tabs}>
          <button
            type="button"
            className={`${styles.modal_tab_btn} ${
              activeTab === 'profile' ? styles.modal_tab_active : ''
            }`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Профиль
          </button>
          <button
            type="button"
            className={`${styles.modal_tab_btn} ${
              activeTab === 'exercises' ? styles.modal_tab_active : ''
            }`}
            onClick={() => setActiveTab('exercises')}
          >
            🎙️ Тренажеры
          </button>
          <button
            type="button"
            className={`${styles.modal_tab_btn} ${
              activeTab === 'purchases' ? styles.modal_tab_active : ''
            }`}
            onClick={() => setActiveTab('purchases')}
          >
            🎒 Покупки
          </button>
        </div>

        {loadingUserDetails && activeTab !== 'profile' ? (
          <div className={styles.loading_hint}>Загружаем статистику...</div>
        ) : (
          <>
            {activeTab === 'profile' && (
              <UserProfileTab
                user={fullUser}
                availableCourses={AVAILABLE_COURSES}
                currentPage={currentPage}
                searchQuery={searchQuery}
                onClose={onClose}
                showAlert={showAlert}
              />
            )}

            {activeTab === 'exercises' && (
              <UserExercisesTab
                exerciseStats={fullUser.stats?.exerciseStats || []}
              />
            )}

            {activeTab === 'purchases' && (
              <UserPurchasesTab
                coursesProgress={coursesProgress}
                eventTickets={eventTickets}
                inventory={fullUser.inventory || []}
                availableCourses={AVAILABLE_COURSES}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default UserModal
