// panels/forbidden-page/ForbiddenPage.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import styles from './ForbiddenPage.module.css'
import forbiddenImage from '../../assets/images/other/403_bird.png' 

const ForbiddenPage = () => {
  const navigate = useNavigate()
  
  // Проверяем авторизацию, чтобы дать правильную кнопку
  const { user } = useSelector((state) => state.auth || {})
  const isAuth = !!user

  return (
    <main className={styles.container}>
      <div className={styles.content_card}>
        <div className={styles.image_wrapper}>
          <img 
            src={forbiddenImage} 
            alt="Ошибка 403: Доступ ограничен" 
            className={styles.image} 
          />
        </div>

        <h1 className={styles.title}>Вход ограничен</h1>
        <p className={styles.description}>
          Упс! Для просмотра этой страницы требуются особые права оратора, PRO-подписка или авторизация в системе.
        </p>

        <div className={styles.actions}>
          {isAuth ? (
            <button className={styles.primary_btn} onClick={() => navigate('/')}>
              На главную
            </button>
          ) : (
            <button className={styles.primary_btn} onClick={() => navigate('/auth')}>
              Авторизоваться
            </button>
          )}
          
          <button className={styles.secondary_btn} onClick={() => navigate(-1)}>
            Вернуться назад
          </button>
        </div>
      </div>
    </main>
  )
}

export default ForbiddenPage
