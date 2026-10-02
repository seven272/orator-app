import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import bridge from '@vkontakte/vk-bridge'
import { IoCloseOutline } from 'react-icons/io5'
import { FaCrown, FaBoltLightning } from 'react-icons/fa6'
import { HiSparkles, HiMiniQueueList } from 'react-icons/hi2'
import { TbLock } from 'react-icons/tb'

import { closePremiumModal } from '../../../redux/slices/profileSlice'
import {
  fetchPaymentLink,
  clearPaymentState,
} from '../../../redux/slices/paymentSlice'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import { PREMIUM_TARIFFS } from '../../../constants/premiumTariffs'
import styles from './PremiumModal.module.css'

const PREMIUM_BENEFITS = [
  {
    id: 1,
    icon: <FaBoltLightning size={15} />,
    title: 'Безлимитная практика',
    text: 'Прохождение любых тренажеров неограниченное количество раз без пауз.',
  },
  {
    id: 2,
    icon: <HiSparkles size={16} />,
    title: 'Интерактивный ИИ-оппонент',
    text: 'Умные дебаты, каверзные вопросы и жесткие переговоры с ИИ в реальном времени.',
  },
  {
    id: 3,
    icon: <HiMiniQueueList size={16} />,
    title: 'Глубокая ИИ-аналитика',
    text: 'Поминутный разбор аргументации и доступ к продвинутым сценариям.',
  },
]

const PremiumModal = () => {
  const dispatch = useDispatch()
  const { isVkEnvironment, vkPlatform } = useVkEnvironment()
 
  const isPremiumModalOpen = useSelector(
    (state) => state.profile.isPremiumModalOpen,
  )

  const [loading, setLoading] = useState(false)
  // Локальный стейт для выбранного тарифа
  const [activeTariffCode, setActiveTariffCode] =
    useState('premium_30d')
  const currentTariff = PREMIUM_TARIFFS[activeTariffCode]
  const isPaymentAllowedInVk = ['desktop_web', 'mobile_web'].includes(
    vkPlatform,
  )
  const canShowBuyButton = !isVkEnvironment || isPaymentAllowedInVk
  const canShowWarningText = false

   
 

  useEffect(() => {
    document.body.style.overflow = isPremiumModalOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isPremiumModalOpen])

  useEffect(() => {
    if (!isPremiumModalOpen) return

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [isPremiumModalOpen])

  const handleClose = () => {
    setLoading(false)
    dispatch(clearPaymentState())
    dispatch(closePremiumModal())
  }

  const handleBuyYookassa = async () => {
    setLoading(true)
    try {
      const  confirmationUrl  = await dispatch(
        fetchPaymentLink({
          typeOrder: 'premium_subscription',
          itemCode: currentTariff.itemCode,
          isVk: isVkEnvironment,
        }),
      ).unwrap()

      handleClose()

      if (isVkEnvironment) {
        await bridge
          .send('VKWebAppOpenURL', { url: confirmationUrl })
          .catch(() => window.open(confirmationUrl, '_blank'))
      } else {
        window.open(confirmationUrl, '_blank') ||
          (window.location.href = confirmationUrl)
      }
    } catch (err) {
      message.error(err || 'Ошибка формирования платежа')
      setLoading(false)
    }
  }

  if (!isPremiumModalOpen) return null

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
        >
          <IoCloseOutline size={25} />
        </button>

        <div className={styles.header_zone}>
          <FaCrown size={32} className={styles.big_crown_icon} />
          <h2>Govorix Premium</h2>
          <p className={styles.subtitle}>
            Инструменты профессиональных спикеров
          </p>
        </div>

        <div className={styles.benefits_list}>
          {PREMIUM_BENEFITS.map(({ id, icon, title, text }) => (
            <div key={id} className={styles.benefit_item}>
              <div className={styles.benefit_icon_wrap}>{icon}</div>
              <div className={styles.benefit_text}>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.tariff_tabs_container}>
          {Object.values(PREMIUM_TARIFFS).map((tariff) => (
            <button
              key={tariff.itemCode}
              type="button"
              className={`${styles.tariff_tab_btn} ${
                activeTariffCode === tariff.itemCode
                  ? styles.tariff_tab_btn_active
                  : ''
              }`}
              onClick={() =>
                !loading && setActiveTariffCode(tariff.itemCode)
              }
              disabled={loading}
            >
              {tariff.title}
            </button>
          ))}
        </div>

        {/* Блок цены динамически подстраивается под выбранный тариф */}
        <div className={styles.price_box}>
          <span className={styles.duration}>
            {currentTariff.durationText}
          </span>
          <div className={styles.price_row}>
            <span className={styles.current_price}>
              {currentTariff.price} ₽
            </span>
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
              {loading
                  ? 'Загрузка...'
                  : `Оформить за ${currentTariff.price} ₽`}
            </button>
          ) : (
            <button
              type="button"
              className={styles.activate_btn}
              disabled={true}
            >
              <TbLock size={20} className={styles.lock_icon} />
              Оплата недоступна
            </button>
          )}
        </div>

        {!canShowBuyButton && canShowWarningText && (
          <span className={styles.warning}>
            * Пожалуйста, откройте приложение в компьютерной версии или перейдите на сайт govorix.ru для оплаты подписки.
          </span>
        )}
      </div>
    </div>
  )
}

export default PremiumModal
