import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import bridge from '@vkontakte/vk-bridge'
import { TbLock } from 'react-icons/tb'

import { fetchPaymentLink, fetchCheckOrderStatus, clearPaymentState } from '../../../redux/slices/paymentSlice'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import styles from './CourseCheckoutModal.module.css'

const CourseCheckoutModal = ({ active, onClose, courseTitle, courseCode }) => {
 
  const dispatch = useDispatch()
  const pollingIntervalRef = useRef(null)
  
  const [isBuying, setIsBuying] = useState(false)
  const { currentOrderId, orderStatus } = useSelector((state) => state.payment)
  const { isVkEnvironment, vkPlatform } = useVkEnvironment()

  // 🔒 Правила модерации VK: ЮKassa доступна только на desktop_web и mobile_web [INDEX]
  const isPaymentAllowedInVk = ['desktop_web', 'mobile_web'].includes(vkPlatform)
  const canShowBuyButton = !isVkEnvironment || isPaymentAllowedInVk

  // Блокируем скролл страницы при открытии окна
  useEffect(() => {
    if (active) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [active])

  // Закрытие окна по кнопке Escape
    useEffect(() => {
      if (!active) return
  
      const handleEsc = (e) => {
        if (e.key === 'Escape' && !isBuying) {
          onClose()
        }
      }
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }, [onClose, isBuying, active])

  // Очистка интервала поллинга
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // Универсальный метод закрытия
  const handleClose = () => {
    if (!isBuying) {
      stopPolling()
      dispatch(clearPaymentState())
      onClose()
    }
  }

  // 🛑 АВТО-ПОЛЛИНГ: запуск фоновой проверки, как только сгенерирован ID заказа
  useEffect(() => {
    if (currentOrderId && !pollingIntervalRef.current && orderStatus === 'created' && active) {
      console.log(`[POLLING] Фоновая проверка интенсива: ${currentOrderId}`)
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await dispatch(fetchCheckOrderStatus(currentOrderId)).unwrap()
          
          if (result.itemCode === courseCode) {
            if (result.status === 'completed') {
              stopPolling()
              setIsBuying(false)
              message.success(`Интенсив "${courseTitle}" успешно разблокирован!`)
              dispatch(clearPaymentState())
              onClose() // Закрываем чекаут при успехе
            } else if (result.status === 'failed') {
              stopPolling()
              setIsBuying(false)
              message.error('Платеж отклонен шлюзом ЮKassa')
              dispatch(clearPaymentState())
            }
          }
        } catch (error) {
          console.error('Ошибка поллинга статуса платежа курса:', error)
        }
      }, 3000)
    }

    return () => stopPolling()
  }, [currentOrderId, orderStatus, active, courseCode, courseTitle, dispatch, onClose])

  // 💳 БОЕВОЙ ОБРАБОТЧИК КЛИКА «ОПЛАТИТЬ»
  const handlePaymentSubmit = async () => {
    if (!canShowBuyButton) return
    setIsBuying(true)

    try {
      const paymentData = await dispatch(
        fetchPaymentLink({
          typeOrder: 'course_purchase',
          itemCode: courseCode,
          isVk: isVkEnvironment
        })
      ).unwrap()

      const confirmationUrl = paymentData.confirmationUrl
      if (!confirmationUrl) throw new Error('Ссылка на оплату не найдена в ответе')

      // Каскадный редирект
      if (isVkEnvironment) {
        try {
          await bridge.send('VKWebAppOpenURL', { url: confirmationUrl })
        } catch (bridgeError) {
          console.warn('VK Bridge заблокирован или не сработал. Используем браузерные вкладки.')
          openBrowserTab(confirmationUrl)
        }
      } else {
        openBrowserTab(confirmationUrl)
      }
    } catch (err) {
      message.error(err || 'Не удалось сформировать счет')
      setIsBuying(false)
    }
  }

  const openBrowserTab = (url) => {
    const popup = window.open(url, '_blank')
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      console.warn('Редирект в текущей вкладке из-за блокировщика окон.')
      window.location.href = url
    }
  }

  if (!active) return null

  return (
    <div 
      className={`${styles.custom_backdrop} ${styles.backdrop_active}`} 
      onClick={handleClose}
    >
      <div 
        className={`${styles.custom_modal_body} ${styles.body_active}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {!isBuying && <span className={styles.custom_close_btn} onClick={handleClose}>&times;</span>}
        
        <div className={styles.checkout_modal_content}>
          <h3 className={styles.checkout_main_title}>🛒 Оформление интенсива</h3>
          <p className={styles.checkout_hint}>
            Вы приобретаете доступ к обучающему треку до момента его полного прохождения или 5 провальных попыток экзамена:
          </p>
          <h4 className={styles.checkout_course_title}>{courseTitle}</h4>
          
          <div className={styles.checkout_benefits}>
            <div>✓ Все 4 учебных шагов (Теория, Практика, ИИ)</div>
            <div>✓ Включены реплики нейросети GigaChat-2</div>
            <div>✓ Награда +1000 XP и 100 монет спикера</div>
          </div>

          <div className={styles.checkout_price_tag}>
            <span className={styles.checkout_price_label}>К оплате:</span>
            <div className={styles.checkout_price_values}>
              <span className={styles.checkout_actual_price}>990 ₽</span>
            </div>
          </div>

          <div className={styles.checkout_buttons_wrapper}>
            {canShowBuyButton ? (
              <button
                type="button"
                className={styles.checkout_confirm_btn}
                onClick={handlePaymentSubmit}
                disabled={isBuying}
              >
                {isBuying && orderStatus === 'created' 
                  ? 'Ожидание оплаты...' 
                  : isBuying 
                    ? 'Загрузка шлюза...' 
                    : 'Оплатить через ЮKassa'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.checkout_confirm_btn_disabled}
                disabled={true}
              >
                <TbLock size={16} className={styles.checkout_lock_icon} />
                Оплата в приложении недоступна
              </button>
            )}
          </div>
          
          {!canShowBuyButton && (
            <span className={styles.checkout_vk_warning}>
              * Пожалуйста, откройте Govorix с мобильного браузера на ://vk.com или на десктопе для покупки курса.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCheckoutModal
