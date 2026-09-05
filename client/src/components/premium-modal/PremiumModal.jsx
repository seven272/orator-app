import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import Modal from '../../UI/modal/Modal' // Ваш существующий компонент Modal
import { fetchActivateFakePremium } from '../../redux/slices/profileSlice'
import styles from './PremiumModal.module.css'

const PremiumModal = ({ active, onClose }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const handleBuy = async () => {
    setLoading(false)
    try {
      await dispatch(fetchActivateFakePremium()).unwrap()
      message.success('Премиум-статус успешно активирован!')
      onClose() // Закрываем модалку после успеха
    } catch (err) {
      message.error(err || 'Ошибка активации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal active={active} onClose={onClose}>
      <div className={styles.premium_modal_content}>
        <div className={styles.header_zone}>
          <span className={styles.big_crown}>👑</span>
          <h2>Раскройте силу Govorix Premium</h2>
          <p className={styles.subtitle}>Инструменты профессиональных спикеров на базе ИИ</p>
        </div>

        {/* Преимущества списком */}
        <div className={styles.benefits_list}>
          <div className={styles.benefit_item}>
            <span className={styles.benefit_icon}>🤖</span>
            <div className={styles.benefit_text}>
              <strong>Интерактивный ИИ-оппонент</strong>
              <p>Умные дебаты, каверзные вопросы и жесткие переговоры с ИИ в реальном времени.</p>
            </div>
          </div>

          <div className={styles.benefit_item}>
            <span className={styles.benefit_icon}>📊</span>
            <div className={styles.benefit_text}>
              <strong>Глубокая ИИ-аналитика</strong>
              <p>Разбор аргументации, выявление речевых ошибок и персонализированная оценка за каждое упражнение.</p>
            </div>
          </div>

          <div className={styles.benefit_item}>
            <span className={styles.benefit_icon}>🎙️</span>
            <div className={styles.benefit_text}>
              <strong>Продвинутые тренажеры</strong>
              <p>Помогут отточить цлевой разговорный навые до совершенства. Тосты, самопрезентация, рассказ историй, выступления на сцене и многое другое...</p>
            </div>
          </div>
        </div>

        {/* Инфо о тарифе */}
        <div className={styles.price_box}>
          <span className={styles.duration}>Подписка на 30 дней</span>
          <div className={styles.price_row}>
            <span className={styles.old_price}>490 ₽</span>
            <span className={styles.current_price}>0 ₽ <small>(Тестовый период)</small></span>
          </div>
        </div>

        {/* Действие */}
        <button 
          type="button" 
          className={styles.activate_btn}
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? 'Активация...' : 'Подключить бесплатно'}
        </button>
      </div>
    </Modal>
  )
}

export default PremiumModal
