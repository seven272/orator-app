import React from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './NotFoundPage.module.css'
// Импортируем сгенерированную картинку
import errorImage from '../../assets/images/other/404_bird.jpeg' 

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <main className={styles.container}>
      <div className={styles.content_card}>
        {/* Иллюстрация */}
        <div className={styles.image_wrapper}>
          <img 
            src={errorImage} 
            alt="Ошибка 404: Мысль потерялась" 
            className={styles.image} 
          />
        </div>

        {/* Текстовый блок */}
        <h1 className={styles.title}>Мысль потерялась...</h1>
        <p className={styles.description}>
          Похоже, оратор сбился с темы или этой страницы никогда не существовало. Давай вернемся на главную и продолжим прокачку речи!
        </p>

        {/* Кнопка действия */}
        <button 
          className={styles.home_btn}
          onClick={() => navigate('/')}
        >
          Вернуться на главную
        </button>
      </div>
    </main>
  )
}

export default NotFoundPage
