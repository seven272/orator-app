import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchDailyTasks } from '../../../redux/slices/dailySlice'
import { ImSpinner10 } from "react-icons/im";
import DailyTaskCard from './daily-task-card/DailyTaskCard'

import { All_EXERCISES } from '../../../assets/mocks/exercises'
import styles from './DailyTasksList.module.css'

const DailyTasksList = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {
    tasks = [],
    isDemo,
    status,
  } = useSelector((state) => state.daily || {})



  const demoTasks = [
    All_EXERCISES.level1[0],
    All_EXERCISES.level2[0],
    All_EXERCISES.level3[0],
  ]

  useEffect(() => {
    dispatch(fetchDailyTasks())
  }, [dispatch])



  if (status === 'loading') {
    return (
      <div className={styles.loader}>
        <ImSpinner10 className={styles.loader_icon} />
        <span className={styles.loader_text}>
          {' '}
          Загрузка ежедневных заданий...
        </span>
      </div>
    )
  }

  return (
    <section className={styles.container}>
      {isDemo && (
        <div
          className={styles.guest_alert_banner}
          onClick={() => navigate('/auth')}
        >
          ✨ Вы находитесь в демо-режиме. Войдите, чтобы выполнять
          задания и копить XP!
        </div>
      )}

      <div className={styles.grid}>
        {tasks && tasks.length > 0
          ? tasks.map((task) => (
              <DailyTaskCard
                key={task._id || task.alias}
                task={task}
              />
            ))
          : demoTasks.map((demoTask) => (
              <DailyTaskCard
                key={demoTask._id || demoTask.alias}
                task={demoTask}
              />
            )) || (
              <p className={styles.empty}>
                На сегодня заданий пока нет
              </p>
            )}
      </div>
    </section>
  )
}

export default DailyTasksList
