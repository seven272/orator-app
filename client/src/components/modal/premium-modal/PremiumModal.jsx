import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { IoCloseOutline } from 'react-icons/io5'
import { FaCrown, FaBoltLightning } from 'react-icons/fa6'
import { HiSparkles, HiMiniQueueList } from 'react-icons/hi2'

import {
  fetchActivateFakePremium,
  closePremiumModal,
} from '../../../redux/slices/profileSlice'
import styles from './PremiumModal.module.css'

const PremiumModal = () => {
  const dispatch = useDispatch()
  
  // Управление состоянием полностью переведено на Redux
  const isPremiumModalOpen = useSelector(
    (state) => state.profile.isPremiumModalOpen,
  )
  
  const [loading, setLoading] = useState(false)

  // 🔒 Блокировка скролла страницы при открытом окне
  useEffect(() => {
    if (isPremiumModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPremiumModalOpen])

  // ⌨️ Закрытие окна по кнопке Escape
  useEffect(() => {
    if (!isPremiumModalOpen) return
    
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) {
        dispatch(closePremiumModal())
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isPremiumModalOpen, loading, dispatch])

  // Универсальный обработчик закрытия окна
  const handleClose = () => {
    if (!loading) {
      dispatch(closePremiumModal())
    }
  }

  // Покупка Premium статуса
  const handleBuy = async () => {
    setLoading(true)
    try {
      await dispatch(fetchActivateFakePremium()).unwrap()
      message.success('Premium статус успешно активирован!')
      dispatch(closePremiumModal())
    } catch (err) {
      const text =
        typeof err === 'string'
          ? err
          : err?.message || 'Ошибка активации'
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  // Условный чистый рендер без использования порталов
  if (!isPremiumModalOpen) {
    return null
  }

  return (
    <div
      className={styles.modal_overlay}
      onClick={handleClose}
    >
      <div
        className={styles.premium_modal_content}
        onClick={(evt) => evt.stopPropagation()}
      >
        <button
          type="button"
          className={styles.close_modal_btn}
          onClick={handleClose}
          disabled={loading}
        >
          <IoCloseOutline size={22} />
        </button>

        <div className={styles.header_zone}>
          {/* Статичная элегантная SVG-корона без анимации покачивания */}
          <FaCrown size={32} className={styles.big_crown_icon} />
          <h2>Govorix Premium</h2>
          <p className={styles.subtitle}>
            Инструменты профессиональных спикеров на базе ИИ
          </p>
        </div>

        {/* Ровно 3 вовлекающих, емких и ярких пункта преимуществ */}
        <div className={styles.benefits_list}>
          
          <div className={styles.benefit_item}>
            <div className={styles.benefit_icon_wrap}>
              <FaBoltLightning size={15} />
            </div>
            <div className={styles.benefit_text}>
              <strong>Безлимитная практика</strong>
              <p>
                Прохождение любых базовых и продвинутых тренажеров неограниченное количество раз без пауз и ожиданий.
              </p>
            </div>
          </div>

          <div className={styles.benefit_item}>
            <div className={styles.benefit_icon_wrap}>
              <HiSparkles size={16} />
            </div>
            <div className={styles.benefit_text}>
              <strong>Интерактивный ИИ-оппонент</strong>
              <p>
                Умные дебаты, каверзные вопросы и жесткие переговоры с искусственным интеллектом в реальном времени.
              </p>
            </div>
          </div>

          <div className={styles.benefit_item}>
            <div className={styles.benefit_icon_wrap}>
              <HiMiniQueueList size={16} />
            </div>
            <div className={styles.benefit_text}>
              <strong>Глубокая ИИ-аналитика и курсы</strong>
              <p>
                Поминутный разбор аргументации, выявление речевых ошибок и доступ к продвинутым сценариям выступлений.
              </p>
            </div>
          </div>

        </div>

        <div className={styles.price_box}>
          <span className={styles.duration}>Подписка на 30 дней</span>
          <div className={styles.price_row}>
            <span className={styles.old_price}>490 ₽</span>
            <span className={styles.current_price}>
              0 ₽ <small className={styles.test_period}>Тест</small>
            </span>
          </div>
        </div>

        <button
          type="button"
          className={styles.activate_btn}
          onClick={handleBuy}
          disabled={loading}
        >
          {loading ? 'Активация...' : 'Подключить бесплатно'}
        </button>
      </div>
    </div>
  )
}

export default PremiumModal
