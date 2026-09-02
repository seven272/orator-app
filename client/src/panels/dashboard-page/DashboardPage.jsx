import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfileData } from '../../redux/slices/profileSlice'
import { fetchLiveDuelStats } from '../../redux/slices/liveDuelSlice'
import { fetchGetArchiveCourses } from '../../redux/slices/courseSlice'

import Dashboard from './dashboard/Dashboard'
import DashboardGuestStub from './dashboard-guest-stub/DashboardGuestStub' // Импортируем заглушку
import styles from './DashboardPage.module.css' // Предполагается наличие файла стилей лоадера

const DashboardPage = () => {
  const dispatch = useDispatch()

  // 🔐 Забираем данные авторизации из authSlice
  const { user: authUser, isLoading: authLoading } = useSelector((state) => state.auth)

  const {
    user,
    skills,
    weakPoint,
    recentActivity,
    totalExercises,
    loading: profileLoading,
    error: profileError,
  } = useSelector((state) => state.profile)

  const {
    duelStats,
    statsLoading: duelLoading,
    statsError: duelError,
  } = useSelector((state) => state.liveDuel)

  const { archives } = useSelector((state) => state.course)

  useEffect(() => {
    // Делаем запросы только если пользователь авторизован
    if (authUser) {
      dispatch(fetchProfileData())
      dispatch(fetchLiveDuelStats())
      dispatch(fetchGetArchiveCourses())
    }
  }, [dispatch, authUser])

  // 1. Кастомный аккуратный лоадер во время проверки сессии или загрузки данных
  if (authLoading || (authUser && (profileLoading || duelLoading))) {
    return (
      <div className={styles.page_loader}>
        <div className={styles.spinner}></div>
        <p>Загрузка профиля оратора...</p>
      </div>
    )
  }

  // 2. 🚨 ПРОВЕРКА НА ГОСТЯ: Если сессия проверена и юзера нет — отдаем заглушку
  if (!authUser) {
    return <DashboardGuestStub />
  }

  // 3. Кастомный вынос ошибок без использования antd
  const currentError = profileError || duelError
  if (currentError) {
    return (
      <div className={styles.page_error_wrapper}>
        <div className={styles.error_card}>
          <span className={styles.error_icon}>⚠️</span>
          <h3>Не удалось загрузить статистику</h3>
          <p>{currentError}</p>
        </div>
      </div>
    )
  }

  return (
    <Dashboard
      user={user}
      skills={skills}
      weakPoint={weakPoint}
      recentActivity={recentActivity}
      totalExercises={totalExercises}
      duelStats={duelStats}
      archiveCourses={archives}
    />
  )
}

export default DashboardPage
