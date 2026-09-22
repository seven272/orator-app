// components/header/game-panel-widget/GamePanelWidget.jsx
import React from 'react'
import GamificationSection from './gamification-section/GamificationSection'
import EnergySection from './energy-section/EnergySection'
import styles from './GamePanelWidget.module.css'

const GamePanelWidget = ({ isAuth, isVkGuest, profileUser, siteGuestEnergy }) => {
  return (
    <div className={styles.game_panel_capsule}>
      {/* Левая секция получает пропсы геймификации [INDEX] */}
      <GamificationSection 
        isAuth={isAuth} 
        isVkGuest={isVkGuest} 
        profileUser={profileUser} 
      />

      {/* Центральный разделитель */}
      <div className={styles.block_separator} />

      {/* Правая секция получает пропсы игровой энергии [INDEX] */}
      <EnergySection 
        isAuth={isAuth} 
        isVkGuest={isVkGuest} 
        profileUser={profileUser} 
        siteGuestEnergy={siteGuestEnergy}
      />
    </div>
  )
}

export default GamePanelWidget
