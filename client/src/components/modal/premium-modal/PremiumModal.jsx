import React, { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import bridge from '@vkontakte/vk-bridge'
import { IoCloseOutline, IoInformationCircleOutline } from 'react-icons/io5'
import { FaCrown, FaBoltLightning } from 'react-icons/fa6'
import { HiSparkles, HiMiniQueueList } from 'react-icons/hi2'

import {
  closePremiumModal,
  fetchProfileData,
} from '../../../redux/slices/profileSlice'
import {
  fetchPaymentLink,
  fetchGetPaymentPolicy,
  clearPaymentState,
} from '../../../redux/slices/paymentSlice'
import { useVkEnvironment } from '../../../hooks/useVkEnvironment'
import { resolvePaymentPolicy } from '../../../utils/paymentPolicy'
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
  const { isVkEnvironment, platformKey } = useVkEnvironment()

  const isPremiumModalOpen = useSelector(
    (state) => state.profile.isPremiumModalOpen,
  )
  const { paymentRules, isPolicyLoaded } = useSelector((state) => state.payment)

  const [loading, setLoading] = useState(false)
  const [activeTariffCode, setActiveTariffCode] = useState('premium_30d')

  const currentTariff = PREMIUM_TARIFFS[activeTariffCode]

  // Вычисляем разрешенные методы оплаты для текущей платформы
  const policy = useMemo(
    () => resolvePaymentPolicy(platformKey, paymentRules),
    [platformKey, paymentRules],
  )

  // Подгружаем актуальную политику при открытии модалки, если еще не загружена
  useEffect(() => {
    if (isPremiumModalOpen && !isPolicyLoaded) {
      dispatch(fetchGetPaymentPolicy())
    }
  }, [isPremiumModalOpen, isPolicyLoaded, dispatch])

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

  // МЕТОД 1: Нативная оплата голосами через VK Bridge
  const handleBuyVkVotes = async () => {
    setLoading(true)
    try {
      const data = await bridge.send('VKWebAppShowOrderBox', {
        type: 'item',
        item: currentTariff.itemCode,
      })

      if (data.status === 'success' || data.success === true) {
        message.success(
          'Оплата успешно проведена! Активируем Premium статус...',
        )
        setTimeout(() => {
          dispatch(fetchProfileData())
          handleClose()
        }, 1200)
      }
    } catch (err) {
      console.error('Ошибка вызова платежного окна VK Bridge:', err)
      message.error('Платеж отменен или произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  // МЕТОД 2: Стандартная оплата рублями через ЮKassa
  const handleBuyYookassa = async () => {
    setLoading(true)
    try {
      const confirmationUrl = await dispatch(
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

        {/* СЦЕНАРИЙ А: Платформа запрещает оплату цифровых товаров (Reader / Companion режим) */}
        {policy.isPaymentRestricted ? (
          <div className={styles.restriction_container}>
            <div className={styles.restriction_notice_box}>
              <IoInformationCircleOutline
                size={22}
                className={styles.restriction_icon}
              />
              <p className={styles.restriction_text}>
                {policy.restrictionMessage}
              </p>
            </div>

            <button
              type="button"
              className={styles.understand_btn}
              onClick={handleClose}
            >
              Понятно
            </button>
          </div>
        ) : (
          /* СЦЕНАРИЙ Б: Оплата разрешена (ЮKassa, Голоса ВК или оба варианта) */
          <>
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

            <div className={styles.price_box}>
              <span className={styles.duration}>
                {currentTariff.durationText}
              </span>
              <div className={styles.price_row}>
                <span className={styles.current_price}>
                  {policy.canUseYookassa && !policy.canUseVkVotes
                    ? `${currentTariff.price} ₽`
                    : !policy.canUseYookassa && policy.canUseVkVotes
                      ? `${currentTariff.votesPrice} голосов`
                      : `${currentTariff.price} ₽ / ${currentTariff.votesPrice} голосов`}
                </span>
              </div>
            </div>

            <div className={styles.buttons_container}>
              {policy.canUseYookassa && (
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
              )}

              {policy.canUseVkVotes && (
                <button
                  type="button"
                  className={
                    policy.canUseYookassa
                      ? styles.vk_votes_secondary_btn
                      : styles.activate_btn
                  }
                  onClick={handleBuyVkVotes}
                  disabled={loading}
                >
                  {loading
                    ? 'Загрузка...'
                    : `Оформить за ${currentTariff.votesPrice} голосов`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PremiumModal
