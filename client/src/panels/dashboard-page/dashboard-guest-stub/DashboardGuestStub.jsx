import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './DashboardGuestStub.module.css'

const DashboardGuestStub = () => {
  const navigate = useNavigate()

  return (
    <div className={styles.stub_container}>
      {/* 🔮 Силуэт заблокированного дашборда для создания интриги */}
      <div className={styles.blurred_background} aria-hidden="true">
        <div className={styles.fake_card_large}></div>
        <div className={styles.fake_grid}>
          <div className={styles.fake_card_small}></div>
          <div className={styles.fake_card_small}></div>
        </div>
        <div className={styles.fake_card_large}></div>
      </div>

      {/* 💎 Центральная интерактивная карточка */}
      <div className={styles.modal_card}>
        <div className={styles.icon_wrap}>📊</div>
        <h2 className={styles.title}>Карта ораторских навыков</h2>
        <p className={styles.description}>
          Войдите в аккаунт, чтобы отслеживать свой прогресс, сильные стороны речи, историю активности и победы в живых дуэлях.
        </p>
        <button 
          className={styles.auth_btn}
          onClick={() => navigate('/auth')}
        >
          Войти и начать
        </button>
      </div>
    </div>
  )
}

export default DashboardGuestStub
