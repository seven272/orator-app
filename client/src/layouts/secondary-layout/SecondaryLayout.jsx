import React from 'react'
import { Outlet } from 'react-router-dom'
import styles from './SecondaryLayout.module.css'

const SecondaryLayout = () => {
  return (
    <div className={styles.secondary_theme_bg}>
      {/* Сюда будут подставляться страницы магазина, статистики, курсов и т.д. */}
      <Outlet />
    </div>
  )
}

export default SecondaryLayout
