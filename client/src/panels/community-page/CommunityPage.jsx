import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import Leaderboard from '../../components/leaderboard/Leaderboard'
import FeedList from '../../components/feed-list/FeedList'
import styles from './CommunityPage.module.css'

const CommunityPage = () => {
  const location = useLocation()
  //Инициализируем стейт на основе переданного извне defaultTab
  //Если извне ничего не передали (зашли по прямой ссылке), то включаем по умолчанию 'rating'
  const [activeTab, setActiveTab] = useState(
    location.state?.defaultTab || 'rating',
  )

  // Эффект на случай, если пользователь уже находится на этой странице, 
  // но кликает на ссылки в меню или шапке (переключает контекст)
  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
    }
  }, [location.state]);
  return (
    <div className={styles.page_container}>
      {/* Главный капсульный переключатель Сообщества */}
      <div className={styles.community_tabs}>
        <button
          className={`${styles.tab_btn} ${activeTab === 'rating' ? styles.tab_active : ''}`}
          onClick={() => setActiveTab('rating')}
        >
          🏆 Таблица лидеров
        </button>
        <button
          className={`${styles.tab_btn} ${activeTab === 'feed' ? styles.tab_active : ''}`}
          onClick={() => setActiveTab('feed')}
        >
          ⚡ Живая лента
        </button>
      </div>

      {/* Условный рендер независимых дочерних компонентов */}
      <div className={styles.content_wrapper}>
        {activeTab === 'rating' ? <Leaderboard /> : <FeedList />}
      </div>
    </div>
  )
}

export default CommunityPage
