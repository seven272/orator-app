import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfileData } from '../../redux/slices/profileSlice'
import { fetchLiveDuelStats } from '../../redux/slices/liveDuelSlice'
import { fetchGetArchiveCourses } from '../../redux/slices/courseSlice'
import { Spin, Alert } from 'antd'

import Dashboard from './dashboard/Dashboard'

const DashboardPage = () => {
  const dispatch = useDispatch()
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
    dispatch(fetchProfileData())
    dispatch(fetchLiveDuelStats())
    dispatch(fetchGetArchiveCourses())
  }, [dispatch])

  if (profileLoading || duelLoading)
    return <Spin size="large" fullscreen />
  // Выводим ошибку, если хоть один упал
  const currentError = profileError || duelError
  if (currentError)
    return (
      <>
        <Alert
          message="Ошибка загрузки данных"
          description={currentError}
          type="error"
          showIcon
        />
      </>
    )

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
