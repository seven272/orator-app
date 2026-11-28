import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import {
  fetchGetPaymentPolicy,
  fetchUpdatePaymentPolicy,
} from '../../../redux/slices/paymentSlice'
import { DEFAULT_PAYMENT_RULES } from '../../../utils/paymentPolicy'

import styles from './PaymentPolicyManagement.module.css'

const PLATFORMS_CONFIG = [
  {
    key: 'vk_native_mobile',
    title: '📱 ВК Мобильные приложения (iOS / Android)',
    hint: 'App Store и Google Play запрещают ЮKassa. Выберите «Только Голоса ВК» или «Инфо-заглушка» для прохождения модерации.',
    options: [
      { value: 'vk_votes', label: 'Только Голоса ВК' },
      { value: 'info_only', label: 'Инфо-заглушка (скрыть оплату)' },
      { value: 'yookassa', label: 'Только ЮKassa' },
      { value: 'both', label: 'Выбор: ЮKassa и Голоса ВК' },
    ],
  },
  {
    key: 'vk_web',
    title: '🌐 ВК Веб (Десктоп и мобильный браузер)',
    hint: 'В браузерной версии ВК разрешены как ЮKassa, так и Голоса.',
    options: [
      { value: 'yookassa', label: 'Только ЮKassa' },
      { value: 'vk_votes', label: 'Только Голоса ВК' },
      { value: 'both', label: 'Выбор: ЮKassa и Голоса ВК' },
      { value: 'info_only', label: 'Инфо-заглушка (скрыть оплату)' },
    ],
  },
  {
    key: 'web',
    title: '💻 Независимый сайт (govorix.ru)',
    hint: 'Основной веб-сайт вне экосистемы соцсетей.',
    options: [
      { value: 'yookassa', label: 'Только ЮKassa' },
      { value: 'info_only', label: 'Инфо-заглушка (тех. работы)' },
    ],
  },
  {
    key: 'telegram',
    title: '✈️ Telegram Mini Apps',
    hint: 'Для прохождения модерации в Telegram без Stars используйте инфо-заглушку.',
    options: [
      { value: 'info_only', label: 'Инфо-заглушка (скрыть оплату)' },
      { value: 'yookassa', label: 'Только ЮKassa' },
    ],
  },
  {
    key: 'rustore',
    title: '🤖 RuStore (Android APK)',
    hint: 'Настройки для сборки в российском магазине приложений.',
    options: [
      { value: 'info_only', label: 'Инфо-заглушка (скрыть оплату)' },
      { value: 'yookassa', label: 'Только ЮKassa' },
    ],
  },
]

const PaymentPolicyManagement = () => {
  const dispatch = useDispatch()
  const { paymentRules, isPolicyLoaded, isUpdatingPolicy } = useSelector(
    (state) => state.payment,
  )

  const [localRules, setLocalRules] = useState(DEFAULT_PAYMENT_RULES)

  useEffect(() => {
    if (!isPolicyLoaded) {
      dispatch(fetchGetPaymentPolicy())
    }
  }, [dispatch, isPolicyLoaded])

  useEffect(() => {
    if (paymentRules) {
      setLocalRules({
        ...DEFAULT_PAYMENT_RULES,
        ...paymentRules,
      })
    }
  }, [paymentRules])

  const handleRuleChange = (platformKey, value) => {
    setLocalRules((prev) => ({
      ...prev,
      [platformKey]: value,
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await dispatch(fetchUpdatePaymentPolicy(localRules)).unwrap()
      message.success('Правила оплаты по платформам успешно обновлены!')
    } catch (err) {
      message.error(err || 'Не удалось сохранить настройки оплаты')
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header_card}>
        <h2 className={styles.title}>💳 Политика приёма платежей</h2>
        <p className={styles.subtitle}>
          Управляйте доступными способами оплаты цифровых товаров (Premium и
          интенсивы) для каждой площадки без пересборки фронтенда. Изменения
          вступают в силу мгновенно.
        </p>
      </div>

      <form className={styles.form_list} onSubmit={handleSave}>
        {PLATFORMS_CONFIG.map((platform) => (
          <div key={platform.key} className={styles.platform_card}>
            <div className={styles.platform_title}>{platform.title}</div>
            <p className={styles.platform_hint}>{platform.hint}</p>

            <select
              className={styles.select_input}
              value={localRules[platform.key] || ''}
              onChange={(e) => handleRuleChange(platform.key, e.target.value)}
              disabled={isUpdatingPolicy}
            >
              {platform.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        <button
          type="submit"
          className={styles.save_btn}
          disabled={isUpdatingPolicy}
        >
          {isUpdatingPolicy ? 'Сохраняем...' : 'Сохранить правила оплаты'}
        </button>
      </form>
    </div>
  )
}

export default PaymentPolicyManagement
