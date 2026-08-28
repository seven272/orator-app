import React, { useState, useEffect } from 'react'
import { useDispatch } from 'react-redux'

import styles from './AdminPage.module.css'
import StatisticsTotal from './statistics-total/StatisticsTotal'
import UsersManagement from './users-management/UsersManagement.jsx'
import MerchManagement from './merch-management/MerchManagement.jsx'

import {
  fetchAdminAnalytics,
  fetchAdminUsers,
  clearAdminState,
  fetchAdminMerchOrders,
} from '../../redux/slices/adminSlice.js'

const AdminPage = () => {
  const dispatch = useDispatch()
  const [activeTab, setActiveTab] = useState('total')

  useEffect(() => {
    dispatch(fetchAdminAnalytics())
    dispatch(fetchAdminUsers())
    dispatch(fetchAdminMerchOrders())

    return () => {
      dispatch(clearAdminState())
    }
  }, [dispatch])
  return (
    <div className={styles.admin_page}>
      <h1 className={styles.dashboard_title}>
        Панель администратора AI Oratory
      </h1>
      {/* Навигационное переключение вкладок */}
      <div className={styles.tabs_navigation}>
        <button
          className={`${styles.tab_button} ${activeTab === 'total' ? styles.tab_button_active : ''}`}
          onClick={() => setActiveTab('total')}
        >
          📊 Аналитика
        </button>
        <button
          className={`${styles.tab_button} ${activeTab === 'users' ? styles.tab_button_active : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Пользователи
        </button>
        <button
          className={`${styles.tab_button} ${activeTab === 'merch' ? styles.tab_button_active : ''}`}
          onClick={() => setActiveTab('merch')}
        >
          📦 Заказы мерча
        </button>
      </div>

      {/* Условный рендеринг в зависимости от выбранного таба */}
      {activeTab === 'total' && <StatisticsTotal />}
      {activeTab === 'users' && <UsersManagement />}
      {activeTab === 'merch' && <MerchManagement />}
    </div>
  )
}

export default AdminPage
