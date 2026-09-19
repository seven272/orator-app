import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd'
import styles from './EnergyBadge.module.css'

const EnergyBadge = ({ isAuth, isVkGuest, profileUser, siteGuestEnergy }) => {
  const navigate = useNavigate()

  // 1. КЕЙС БЕЗЛИМИТНОГО PREMIUM [INDEX]
  if (isAuth && profileUser?.isPremium) {
    return (
      <Tooltip 
        title="У вас активирован безлимитный доступ! Лимиты суточной энергии полностью отключены."
        placement="bottom"
      >
        <div 
          className={`${styles.energy_container} ${styles.premium_theme}`}
          onClick={() => navigate('/shop')}
        >
          <span className={styles.icon}>👑</span>
          <span className={styles.label}>Premium</span>
        </div>
      </Tooltip>
    )
  }

  // Расчет параметров шкалы для остальных кейсов
  let allowed = 3
  let current = 3
  let tooltipText = ''
  let clickAction = null

  if (isVkGuest) {
    // 2. КЕЙС ГОСТЯ ВК [INDEX]
    const localVkEnergy = localStorage.getItem('govorix_guest_energy')
    allowed = 3
    current = localVkEnergy !== null ? parseInt(localVkEnergy, 10) : 3
    tooltipText = 'Суточный лимит гостевой энергии ВК для уровней 1 и 2. Нажмите, чтобы зарегистрироваться и расширить бак до 15 ⚡!'
  } else if (isAuth) {
    // 3. КЕЙС ЗАРЕГИСТРИРОВАННОГО ЮЗЕРА [INDEX]
    allowed = profileUser?.dailyEnergy?.allowed ?? 15
    const used = profileUser?.dailyEnergy?.used ?? 0
    current = Math.max(0, allowed - used)
    tooltipText = 'Суточная энергия для тренажеров 1 и 2 уровня. Восстанавливается раз в сутки. Зайдите в Магазин для снятия ограничений.'
    clickAction = () => navigate('/shop')
  } else {
    // 4. КЕЙС АНОНИМА С САЙТА [INDEX]
    allowed = 3
    current = siteGuestEnergy
    tooltipText = 'Гостевой лимит энергии сайта. Войдите в аккаунт, чтобы мгновенно получить 15 единиц энергии и сохранять прогресс!'
    clickAction = () => navigate('/auth')
  }

  // Расчет процента заполнения и выбор цвета батарейки
  const percentage = Math.min(100, Math.max(0, (current / allowed) * 100))
  
  let energyColorClass = styles.fill_green
  if (current <= 0) {
    energyColorClass = styles.fill_empty
  } else if (percentage <= 35) {
    energyColorClass = styles.fill_yellow
  }

  return (
    <Tooltip title={tooltipText} placement="bottom">
      <div 
        className={`${styles.energy_container} ${current <= 0 ? styles.alert_pulse : ''}`}
        onClick={clickAction}
      >
        <span className={styles.bolt_icon}>⚡</span>
        
        {/* Геймифицированный трек-шкала */}
        <div className={styles.progress_track}>
          <div 
            className={`${styles.progress_fill} ${energyColorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className={styles.digital_counter}>
          {current}/{allowed}
        </span>
      </div>
    </Tooltip>
  )
}

export default EnergyBadge
