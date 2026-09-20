import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Tooltip } from 'antd'
import { FaCrown } from 'react-icons/fa'
import styles from './GamePanelWidget.module.css'

const GamePanelWidget = ({ isAuth, isVkGuest, profileUser }) => {
  const navigate = useNavigate()

  // 1. Сбор параметров левой части (Геймификация)
  const currentLevel = isAuth ? (profileUser?.level ?? 1) : 0
  const currentXp = isAuth ? (profileUser?.xp ?? 0) : 0

  // Единый источник правды для энергии — Redux-стейт профиля
  // Теперь и бэкенд (для юзеров), и редюсер syncGuestEnergy (для гостей) пишут в одну структуру! [INDEX]
  const allowed =
    profileUser?.dailyEnergy?.allowed ?? (isAuth ? 15 : 3)
  const used = profileUser?.dailyEnergy?.used ?? 0
  const currentEnergy = Math.max(0, allowed - used)

  const isPremium = isAuth && profileUser?.isPremium
  const isEmpty = currentEnergy <= 0
  const percentage = Math.min(
    100,
    Math.max(0, (currentEnergy / allowed) * 100),
  )

  // Динамический расчет всплывающих подсказок и путей клика в зависимости от платформы
  let energyTooltip = ''
  let energyClickAction = null

  if (isVkGuest) {
    energyTooltip =
      'Гостевой лимит энергии ВК для уровней 1 и 2. Создайте аккаунт для расширения бака до 15 ⚡!'
  } else if (isAuth) {
    energyTooltip =
      'Суточная энергия для тренажеров 1 и 2 уровня. Восстанавливается раз в сутки.'
    energyClickAction = () => navigate('/shop')
  } else {
    // Аноним сайта
    energyTooltip =
      'Гостевой лимит энергии сайта. Войдите, чтобы расширить бак до 15 ⚡ и сохранять прогресс!'
    energyClickAction = () => navigate('/auth')
  }

  // Определение цвета заполнения вертикальной батарейки
  let fillColors = styles.fill_green
  if (isEmpty) {
    fillColors = styles.fill_empty
  } else if (percentage <= 35) {
    fillColors = styles.fill_yellow
  }

  return (
    <div
      className={`${styles.game_panel_capsule} ${!isPremium && isEmpty ? styles.pulse_alert : ''}`}
    >
      {/* 📊 ЛЕВАЯ ПОЛОВИНА: ГЕЙМИФИКАЦИЯ */}
      <Tooltip
        title="Ваш текущий уровень и игровой опыт. Нажмите для перехода на Дашборд."
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
          className={styles.gamification_section}
          onClick={() => navigate(isAuth ? '/dashboard' : '/auth')}
        >
          <span
            className={`${styles.status_text} ${styles.level_full}`}
          >
            Lvl {currentLevel}
          </span>
          <span
            className={`${styles.status_text} ${styles.level_short}`}
          >
            Lvl {currentLevel}
          </span>
          <span className={styles.text_divider}>|</span>
          <span className={styles.status_text}>{currentXp} XP</span>
        </div>
      </Tooltip>

      {/* ┃ ЦЕНТРАЛЬНЫЙ РАЗДЕЛИТЕЛЬ СЕКЦИЙ */}
      <div className={styles.block_separator} />

      {/* ⚡ ПРАВАЯ ПОЛОВИНА: ВЕРТИКАЛЬНАЯ БАТАРЕЙКА ИЛИ PREMIUM */}
      {isPremium ? (
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
            {/* <span>Premium</span> */}
          </div>
        </Tooltip>
      ) : (
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
            {/* Стилизованная вертикальная микро-батарейка (сжатие снизу вверх) */}
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
      )}
    </div>
  )
}

export default GamePanelWidget
