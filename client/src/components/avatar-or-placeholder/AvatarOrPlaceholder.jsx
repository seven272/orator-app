import React from 'react'
import { FaUser } from "react-icons/fa";
import styles from './AvatarOrPlaceholder.module.css'

// Переменная переведена в camelCase
const getAvatarColor = (str) => {
  if (!str) return 'var(--color-text-secondary)'
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const colors = [
    'var(--color-primary)',
    'var(--color-pink)',
    'var(--color-yellow)',
    'var(--color-green)',
    '#9c27b0', 
    '#ff5722'  
  ]
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

// Проп изменен на sizeClass (camelCase)
const AvatarOrPlaceholder = ({ user, sizeClass = 'size_m', onClick }) => {
  // 1. ЕСЛИ ПОЛЬЗОВАТЕЛЬ НЕ АВТОРИЗОВАН
  if (!user) {
    return (
      <div 
        className={`${styles.avatar_base} ${styles[sizeClass]} ${styles.unauth_bg}`} 
        onClick={onClick}
      >
        <FaUser className={styles.svg_icon}/>
      </div>
    )
  }

  const { avatar, displayName } = user
  
  // Переменная изменена на isCustomAvatar (camelCase). Проверяем чистую пустую строку в БД
  const isCustomAvatar = Boolean(avatar && avatar.trim() !== '')

  // 2. ЕСЛИ ЕСТЬ РЕАЛЬНЫЙ АВАТАР
  if (isCustomAvatar) {
    return (
      <img 
        src={avatar} 
        alt={displayName || 'User'} 
        className={`${styles.avatar_base} ${styles[sizeClass]} ${styles.img_style}`}
        onClick={onClick}
      />
    )
  }

  // 3. ЕСЛИ АВТОРИЗОВАН, НО НУЖНА БУКВЕННАЯ ЗАГЛУШКА
  const nameToSplit = displayName || 'Orator'
  const initials = nameToSplit.substring(0, 2).toUpperCase()
  const bgColor = getAvatarColor(nameToSplit) // Вызов функции в camelCase

  return ( 
    <div 
      className={`${styles.avatar_base} ${styles[sizeClass]} ${styles.placeholder_bg}`}
      style={{ backgroundColor: bgColor }}
      onClick={onClick}
    >
      <span className={styles.initials_text}>{initials}</span>
    </div>
  )
}

export default AvatarOrPlaceholder
