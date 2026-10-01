import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import bridge from '@vkontakte/vk-bridge'
import { TbLock } from 'react-icons/tb'
import { PiBookOpenUserLight } from 'react-icons/pi'

import {
  fetchPaymentLink,
  clearPaymentState,
} from '../../../redux/slices/paymentSlice'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import { usePaymentPolling } from '../../../hooks/usePaymentPolling'
import styles from './CourseCheckoutModal.module.css'

const CourseCheckoutModal = ({
  active,
  onClose,
  courseTitle,
  courseCode,
}) => {
  const dispatch = useDispatch()
  const [isBuying, setIsBuying] = useState(false)

  // 1. Сначала извлекаем данные окружения и Редакса
  const { orderStatus } = useSelector((state) => state.payment)
  const { isVkEnvironment, vkPlatform } = useVkEnvironment()

  const isPaymentAllowedInVk = ['desktop_web', 'mobile_web'].includes(
    vkPlatform,
  )
  const canShowBuyButton = !isVkEnvironment || isPaymentAllowedInVk
  const canShowWarningText = false

  // 2. И только ПОСЛЕ этого передаем параметры в наш универсальный хук поллинга!
  const { stopPolling } = usePaymentPolling(
    active,
    courseCode,
    () => {
      setIsBuying(false)
      message.success(
        `Интенсив "${courseTitle}" успешно разблокирован!`,
      )
      onClose() // Бесшовно закрываем окно при успехе, курсы обновятся через extraReducers
    },
  )

  // Блокируем скролл страницы при открытии окна
  useEffect(() => {
    document.body.style.overflow = active ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [active])

  // Чистый и безопасный метод закрытия (UX-френдли, без блокировок зависшим loading)
  const handleClose = () => {
    stopPolling()
    setIsBuying(false)
    dispatch(clearPaymentState())
    onClose()
  }

  const handlePaymentSubmit = async () => {
    if (!canShowBuyButton) return
    setIsBuying(true)

    try {
      const { confirmationUrl } = await dispatch(
        fetchPaymentLink({
          typeOrder: 'course_purchase',
          itemCode: courseCode,
          isVk: isVkEnvironment,
        }),
      ).unwrap()

      if (isVkEnvironment) {
        await bridge
          .send('VKWebAppOpenURL', { url: confirmationUrl })
          .catch(() => openBrowserTab(confirmationUrl))
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
    if (
      !popup ||
      popup.closed ||
      typeof popup.closed === 'undefined'
    ) {
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
        {/* Крестик активен ВСЕГДА, чтобы модалка не стала капканом при зависании сети */}
        <span
          className={styles.custom_close_btn}
          onClick={handleClose}
        >
          &times;
        </span>

        <div className={styles.checkout_modal_content}>
          <h3 className={styles.checkout_main_title}>
            <PiBookOpenUserLight
              size={30}
              className={styles.icon_title}
            />{' '}
            Оформление интенсива
          </h3>
          <p className={styles.checkout_hint}>
            Вы приобретаете доступ к обучающему треку до момента его
            полного прохождения или 5 провальных попыток экзамена:
          </p>
          <h4 className={styles.checkout_course_title}>
            {courseTitle}
          </h4>

          <div className={styles.checkout_benefits}>
            <div className={styles.benefit_row}>
              <span className={styles.benefit_emoji}>🎓</span>
              <div>
                <strong>Полный трек обучения:</strong> теория,
                ИИ-практика, челлендж и экзамен
              </div>
            </div>

            <div className={styles.benefit_row}>
              <span className={styles.benefit_emoji}>🤖</span>
              <div>
                <strong>Интеграция с ИИ:</strong> мгновенная оценка
                речи и умный фидбек
              </div>
            </div>

            <div className={styles.benefit_row}>
              <span className={styles.benefit_emoji}>🏆</span>
              <div>
                <strong>Финальные награды:</strong> +1000 XP и 100
                монет спикера в профиль
              </div>
            </div>
          </div>

          <div className={styles.checkout_price_tag}>
            <span className={styles.checkout_price_label}>
              К оплате:
            </span>
            <div className={styles.checkout_price_values}>
              <span className={styles.checkout_actual_price}>
                990 ₽
              </span>
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
                    ? 'Загрузка...'
                    : 'Оплатить'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.checkout_confirm_btn_disabled}
                disabled={true}
              >
                <TbLock
                  size={16}
                  className={styles.checkout_lock_icon}
                />
                Оплата в приложении недоступна
              </button>
            )}
          </div>

          {!canShowBuyButton && canShowWarningText && (
            <span className={styles.checkout_vk_warning}>
                 * Пожалуйста, откройте приложение в компьютерной версии или перейдите на сайт govorix.ru для оплаты подписки.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCheckoutModal
