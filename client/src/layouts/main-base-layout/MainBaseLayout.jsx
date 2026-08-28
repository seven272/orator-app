import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../../components/header/Header'
import Footer from '../../components/footer/Footer'

import styles from './MainBaseLayout.module.css'

const MainBaseLayout = () => {
  return (
    <div className={styles.base_interface_wrapper}>
      <Header />
      <div className={styles.base_content_zone}>
        {/* Сюда будут динамически подставляться страницы и их фоновые макеты */}
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

export default MainBaseLayout
