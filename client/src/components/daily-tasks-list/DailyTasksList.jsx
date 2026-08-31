import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDailyTasks } from '../../redux/slices/dailySlice' 
import DailyTaskCard from './daily-task-card/DailyTaskCard'
import styles from './DailyTasksList.module.css'

const DailyTasksList = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { tasks = [], isDemo, status } = useSelector((state) => state.daily || {})

  useEffect(() => {
    dispatch(fetchDailyTasks())
  }, [dispatch])

  if (status === 'loading') {
    return <div className={styles.loader}>Загрузка ежедневных заданий...</div>
  }

  // Если пользователь гость, мы перехватываем клик по всей сетке, 
  // прерываем дефолтный переход в тренажер и отправляем его на /auth
  const handleGridClickCapture = (e) => {
    if (isDemo) {
      e.stopPropagation()
      e.preventDefault()
      navigate('/auth')
    }
  }

  return (
    <section className={styles.container}>
      {isDemo && (
        <div className={styles.guest_alert_banner} onClick={() => navigate('/auth')}>
          ✨ Вы находитесь в демо-режиме. Войдите, чтобы выполнять задания и копить XP!
        </div>
      )}

      {/* onClickCapture сработает ДО того, как клик дойдет до внутренностей DailyTaskCard */}
      <div className={styles.grid} onClickCapture={handleGridClickCapture}>
        {tasks && tasks.length > 0 ? (
          tasks.map((task) => (
            <DailyTaskCard key={task._id || task.alias} task={task} />
          ))
        ) : (
          <p className={styles.empty}>На сегодня заданий пока нет</p>
        )}
      </div>
    </section>
  )
}

export default DailyTasksList
