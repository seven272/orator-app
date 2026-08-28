import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchDailyTasks } from '../../redux/slices/dailySlice' 
import DailyTaskCard from './daily-task-card/DailyTaskCard'
import styles from './DailyTasksList.module.css'

const DailyTasksList = () => {
  const dispatch = useDispatch()

  // Берем данные из созданного нами ранее dailySlice
  const { tasks, status, error } = useSelector((state) => state.daily)

  useEffect(() => {
    // Загружаем задачи при монтировании
    dispatch(fetchDailyTasks())
  }, [dispatch])

  if (status === 'loading') {
    return (
      <div className={styles.loader}>
        Загрузка ежедневных заданий...
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className={styles.error}>
        Ошибка: {error?.message || 'Не удалось загрузить данные'}
      </div>
    )
  }

  return (
    <section className={styles.container}>
    
      <div className={styles.grid}>
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
