/* eslint-disable react/prop-types */
import React from 'react'
import styles from './ShopItemCard.module.css'

const ShopItemCard = ({ item, userInventory, isThisItemBuying, onBuyClick }) => {
  // Напрямую берем статус покупки из Redux-инвентаря, который обновляется мгновенно
  const isOwned = userInventory.some((inv) => inv.itemCode === item.code)
  const isUnique = item.category !== 'utility' && item.category !== 'merch'

  const iconMap = {
    freeze: '❄️',
    'theme-cyber': '🌐',
    'crown-title': '👑',
    'ai-prompt': '💡',
    'color-glow': '✨',
    'premium-1h': '⚡',
    'title-neon': '🌃',
    'ticket-rap': '🎤',
    'ticket-bargain': '🤝',
    'ticket-history': '🏛️',
    'physical-badge': '🏅',
    'physical-diploma': '📜',
  }

  return (
  <div className={styles.card}>
    {/* Контейнер для иконки и текста */}
    <div className={styles.cardContent}>
      <div className={styles.iconBox}>{iconMap[item.icon] || '📦'}</div>

      <div className={styles.info}>
        <span className={styles.itemTitle}>{item.title}</span>
        <span className={styles.description}>{item.description}</span>
      </div>
    </div>

    {/* Кнопка всегда внизу на мобилках и справа на десктопах */}
    <button
      className={styles.buyButton}
      disabled={(isUnique && isOwned) || isThisItemBuying}
      onClick={() => onBuyClick(item)}
    >
      {isUnique && isOwned ? (
        'Куплено'
      ) : isThisItemBuying ? (
        '...'
      ) : (
        `🪙 ${item.price}`
      )}
    </button>
  </div>
)

}

export default ShopItemCard
