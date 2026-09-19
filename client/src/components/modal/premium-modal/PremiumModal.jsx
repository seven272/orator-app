/* eslint-disable react/prop-types */
import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import { IoCloseOutline } from 'react-icons/io5'

import { fetchActivateFakePremium } from '../../../redux/slices/profileSlice'
import styles from './PremiumModal.module.css'

const PremiumModal = ({ active, onClose }) => {
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  // 🔒 Блокировка скролла
  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [active])

  // Escape для закрытия
  useEffect(() => {
    if (!active) return
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [active, onClose, loading])

  if (!active) return null

  const handleBuy = async () => {
    setLoading(true)
    try {
      await dispatch(fetchActivateFakePremium()).unwrap()
      message.success('Premium статус успешно активирован!')
      onClose()
    } catch (err) {
      const text = typeof err === 'string' ? err : err?.message || 'Ошибка активации'
      message.error(text)
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className={styles.modal_overlay} onClick={loading ? undefined : onClose}>
      <div className={styles.premium_modal_content} onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.close_modal_btn} onClick={onClose}>
          <IoCloseOutline size={24} />
        </button>

        <div className={styles.header_zone}>
          <span className={styles.big_crown}>👑</span>
          <h2>Раскройте силу Govorix Premium</h2>
          <p className={styles.subtitle}>Инструменты профессиональных спикеров на базе ИИ</p>
        </div>

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
              <p>
                Помогут отточить целевой разговорный навык до совершенства. Тосты, самопрезентация,
                рассказ историй, выступления на сцене и многое другое...
              </p>
            </div>
          </div>
        </div>

        <div className={styles.price_box}>
          <span className={styles.duration}>Подписка на 30 дней</span>
          <div className={styles.price_row}>
            <span className={styles.old_price}>490 ₽</span>
            <span className={styles.current_price}>
              0 ₽ <small className={styles.test_period}>(Тестовый период)</small>
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
    </div>,
    document.body
  )
}

export default PremiumModal
