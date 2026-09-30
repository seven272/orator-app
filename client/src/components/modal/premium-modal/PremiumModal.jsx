import React, { useEffect, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import { IoCloseOutline } from 'react-icons/io5'
import { FaCrown, FaBoltLightning } from 'react-icons/fa6'
import { HiSparkles, HiMiniQueueList } from 'react-icons/hi2'
import { TbLock } from 'react-icons/tb'
import bridge from '@vkontakte/vk-bridge'

import {
  fetchPaymentLink,
  fetchCheckOrderStatus,
  clearPaymentState,
} from '../../../redux/slices/paymentSlice'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment' // Путь к вашему хуку
import {
  fetchActivateFakePremium,
  closePremiumModal,
} from '../../../redux/slices/profileSlice'
import styles from './PremiumModal.module.css'

const PremiumModal = () => {
  const dispatch = useDispatch()
  const pollingIntervalRef = useRef(null)

  const isPremiumModalOpen = useSelector(
    (state) => state.profile.isPremiumModalOpen,
  )
  const { currentOrderId, orderStatus } = useSelector(
    (state) => state.payment,
  )

  const [loading, setLoading] = useState(false)
  const { isVkEnvironment, vkPlatform } = useVkEnvironment()

  // 1. Политика модерации VK: Оплата через ЮKassa разрешена только в Web-версиях ВК [INDEX]
  const isPaymentAllowedInVk = ['desktop_web', 'mobile_web'].includes(
    vkPlatform,
  )
  const canShowBuyButton = !isVkEnvironment || isPaymentAllowedInVk

  // Блокировка скролла страницы при открытом окне
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

  // Закрытие окна по кнопке Escape
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

  // Очистка интервала поллинга при размонтировании или закрытии
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  const handleClose = () => {
    if (!loading) {
      stopPolling()
      dispatch(clearPaymentState())
      dispatch(closePremiumModal())
    }
  }

  // ЭФФЕКТ АВТО-ПОЛЛИНГА: Запускается, как только сгенерирован Order ID
  useEffect(() => {
    if (
      currentOrderId &&
      !pollingIntervalRef.current &&
      orderStatus === 'created'
    ) {
      console.log(
        `[POLLING] Запуск фоновой проверки заказа: ${currentOrderId}`,
      )

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await dispatch(
            fetchCheckOrderStatus(currentOrderId),
          ).unwrap()

          if (result.status === 'completed') {
            stopPolling()
            setLoading(false)
            message.success('Premium статус успешно активирован!')
            dispatch(closePremiumModal())
            dispatch(clearPaymentState())
          } else if (result.status === 'failed') {
            stopPolling()
            setLoading(false)
            message.error('Платеж был отклонен или произошла ошибка')
          }
        } catch (pollError) {
          console.error('Ошибка поллинга статуса платежа:', pollError)
        }
      }, 3000) // Опрашиваем бэкенд каждые 3 секунды
    }

    return () => stopPolling()
  }, [currentOrderId, orderStatus, dispatch])

  // 💳 БОЕВАЯ ПОКУПКА ЧЕРЕЗ ЮKASSA
  const handleBuyYookassa = async () => {
    setLoading(true)
    try {
      // Генерируем ссылку на оплату на бэкенде
      const paymentData = await dispatch(
        fetchPaymentLink({
          typeOrder: 'premium_subscription',
          itemCode: 'premium_30d',
          isVk: isVkEnvironment,
        }),
      ).unwrap()

      const confirmationUrl = paymentData.confirmationUrl
      if (!confirmationUrl)
        throw new Error('Ссылка на оплату не получена')

      // КАСКАДНЫЙ РЕДИРЕКТ НА ПЛАТЕЖНЫЙ ШЛЮЗ
      if (isVkEnvironment) {
        try {
          // 1. Способ для ВК: Нативное открытие ссылки через VK Bridge
          await bridge.send('VKWebAppOpenURL', {
            url: confirmationUrl,
          })
        } catch (bridgeError) {
          console.warn(
            'VK Bridge не сработал, переходим к браузерным методам',
          )
          openBrowserTab(confirmationUrl)
        }
      } else {
        // 2. Способ для обычного сайта
        openBrowserTab(confirmationUrl)
      }
    } catch (err) {
      message.error(err || 'Ошибка формирования платежа')
      setLoading(false)
    }
  }

  // Вспомогательный метод открытия вкладки/всплывающего окна
  const openBrowserTab = (url) => {
    const popup = window.open(url, '_blank')
    if (
      !popup ||
      popup.closed ||
      typeof popup.closed === 'undefined'
    ) {
      console.warn(
        'Всплывающее окно заблокировано мобильным браузером. Редирект в текущей вкладке.',
      )
      window.location.href = url
    }
  }

  // 🧪 ИМИТАЦИЯ ОПЛАТЫ (Для локальных тестов разработки)
  const handleFakeBuy = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/pay/fake-buy-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message)

      message.success('Имитация: Premium успешно активирован!')
      dispatch(closePremiumModal())
    } catch (err) {
      message.error(err.message || 'Ошибка симуляции')
    } finally {
      setLoading(false)
    }
  }

  // Условный чистый рендер без использования порталов
  if (!isPremiumModalOpen) {
    return null
  }

  return (
    <div className={styles.modal_overlay} onClick={handleClose}>
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
          <FaCrown size={32} className={styles.big_crown_icon} />
          <h2>Govorix Premium</h2>
          <p className={styles.subtitle}>
            Инструменты профессиональных спикеров на базе ИИ
          </p>
        </div>

        <div className={styles.benefits_list}>
          <div className={styles.benefit_item}>
            <div className={styles.benefit_icon_wrap}>
              <FaBoltLightning size={15} />
            </div>
            <div className={styles.benefit_text}>
              <strong>Безлимитная практика</strong>
              <p>
                Прохождение любых базовых и продвинутых тренажеров
                неограниченное количество раз без пауз и ожиданий.
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
                Умные дебаты, каверзные вопросы и жесткие переговоры с
                искусственным интеллектом в реальном времени.
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
                Поминутный разбор аргументации, выявление речевых
                ошибок и доступ к продвинутым сценариям выступлений.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.price_box}>
          <span className={styles.duration}>Подписка на 30 дней</span>
          <div className={styles.price_row}>
            <span className={styles.current_price}>490 ₽</span>
          </div>
        </div>

        <div className={styles.buttons_container}>
          {canShowBuyButton ? (
            <button
              type="button"
              className={styles.activate_btn}
              onClick={handleBuyYookassa}
              disabled={loading}
            >
              {loading && orderStatus === 'created'
                ? 'Ожидание оплаты...'
                : loading
                  ? 'Загрузка...'
                  : 'Оформить подписку'}
            </button>
          ) : (
            <button
              type="button"
              className={styles.activate_btn}
              disabled={true}
            >
              <TbLock size={20} className={styles.lock_icon} />
              Оплата в приложении недоступна
            </button>
          )}

          {process.env.NODE_ENV === 'development' && (
            <button
              type="button"
              className={styles.dev_fake_btn}
              onClick={handleFakeBuy}
              disabled={loading}
            >
              🧪 Имитировать оплату (Dev Mode)
            </button>
          )}
        </div>

        {!canShowBuyButton && (
          <span className={styles.warning}>
            * Пожалуйста, зайдите через браузер на сайт Govorix.ru или
            ://vk.com для оплаты подписки.
          </span>
        )}
      </div>
    </div>
  )
}

export default PremiumModal
