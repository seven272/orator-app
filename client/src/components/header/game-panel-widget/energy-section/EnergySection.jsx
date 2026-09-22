// components/game-panel-widget/energy-section/EnergySection.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Tooltip } from 'antd'
import { FaCrown } from 'react-icons/fa'

import {
  checkIsAuth,
  checkIsVkGuest,
} from '../../../../redux/slices/authSlice'
import { openViralModal } from '../../../../redux/slices/vkSlice'
import { openGuestOffer } from '../../../../redux/slices/exerciseSlice'
import { useVkEnvironment } from '../../../../hooks/useVkEnvironment'
import styles from './EnergySection.module.css'

const EnergySection = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isVkEnvironment } = useVkEnvironment()

  // Автономно запрашиваем данные напрямую из Redux
  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)
  const { user: profileUser } = useSelector((state) => state.profile)

  // Вычисление лимитов энергии из профиля
  const isPremium = isAuth && profileUser?.isPremium
  const allowed =
    isVkGuest || !isAuth
      ? 3
      : (profileUser?.dailyEnergy?.allowed ?? 15)
  const currentEnergy = Math.max(0, allowed - (profileUser?.dailyEnergy?.used ?? 0))
  const isEmpty = currentEnergy <= 0
  const percentage = allowed > 0 
    ? Math.min(100, Math.max(0, (currentEnergy / allowed) * 100)) 
    : 0

  // Динамический расчет всплывающих подсказок и действий при клике [INDEX]
  const { energyTooltip, energyClickAction } = useMemo(() => {
    if (isVkGuest) {
      return {
        energyTooltip:
          'Гостевой лимит энергии ВК для уровней 1 и 2. Создайте аккаунт для расширения бака до 15 ⚡!',
        energyClickAction: () => dispatch(openGuestOffer()),
      }
    } else if (isAuth) {
      return {
        energyTooltip:
          'Суточная энергия для тренажеров 1 и 2 уровня. Восстанавливается раз в сутки.',
        energyClickAction: isVkEnvironment
          ? () => dispatch(openViralModal())
          : () => navigate('/shop'),
      }
    } else {
      return {
        energyTooltip:
          'Гостевой лимит энергии сайта. Войдите, чтобы расширить бак до 15 ⚡ и сохранять прогресс!',
        energyClickAction: () => navigate('/auth'),
      }
    }
  }, [isAuth, isVkGuest, isVkEnvironment, dispatch, navigate])

  // Определение цвета заполнения вертикальной микро-батарейки
  const fillColors = useMemo(() => {
    if (isEmpty) return styles.fill_empty
    if (percentage <= 35) return styles.fill_yellow
    return styles.fill_green
  }, [isEmpty, percentage])

  if (isPremium) {
    return (
      <Tooltip
        title="Безлимитный Premium доступ активен! Лимиты энергии полностью отключены."
        placement="bottom"
        color="var(--color-primary)"
        styles={{
          container: {
            fontFamily: 'var(--font-family-regular)',
            fontSize: '11px',
          },
        }}
      >
        <div
          className={styles.premium_wrapper}
          onClick={() => navigate('/shop')}
        >
          <FaCrown className={styles.premium_crown_icon} />
        </div>
      </Tooltip>
    )
  }

  return (
    <Tooltip
      title={energyTooltip}
      placement="bottom"
      color="var(--color-primary)"
      styles={{
        container: {
          fontFamily: 'var(--font-family-regular)',
          fontSize: '11px',
        },
      }}
    >
      <div
        className={styles.energy_section}
        onClick={energyClickAction}
      >
        {/* Стилизованная вертикальная микро-батарейка */}
        <div
          className={`${styles.vertical_battery} ${isEmpty ? styles.battery_alert : ''}`}
        >
          <div
            className={`${styles.battery_fill} ${fillColors}`}
            style={{ height: `${percentage}%` }}
          />
        </div>

        {/* Сине-голубой цифровой счетчик */}
        <span className={styles.digital_counter}>
          {currentEnergy}/{allowed}
        </span>
      </div>
    </Tooltip>
  )
}

export default EnergySection
