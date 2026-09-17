/* eslint-disable react/prop-types */
import React from 'react'
import {
  MdInventory2,
  MdCheckCircle,
  MdConfirmationNumber,
} from 'react-icons/md'
import styles from './UserInventoryList.module.css'

const UserInventoryList = ({ inventory, items }) => {
  // Карта иконок для инвентаря (соответствует иконкам из витрины магазина)
  const iconMap = {
    'freeze': '❄️',
    'theme-cyber': '🌐',
    'crown-title': '👑',
    'ai-prompt': '💡',
    'color-glow': '✨',
    'premium-1h': '⚡',
    'title-neon': '🌃',
    'ticket-rap': '🎤',
    'ticket-bargain': '🤝',
    'ticket-history': '🏛️',
  }

  return (
    <div className={styles.inventory_container}>
      <h3 className={styles.inventory_title}>
        <MdInventory2 className={styles.title_icon} />
        Мои покупки
      </h3>

      <div className={styles.inventory_list}>
        {inventory.map((invItem) => {
          // Ищем мета-данные товара в общем массиве items с витрины, чтобы узнать его название
          const itemMeta = items?.find(
            (shopItem) => shopItem.code === invItem.itemCode,
          )

          if (!itemMeta) return null // Безопасность: если товар удален из БД, не ломаем рендер

          // Проверяем, является ли предмет билетом на тренажер (поштучной попыткой)
          const isTicket = invItem.itemCode.startsWith('ticket_')

          return (
            <div
              key={invItem._id || invItem.itemCode}
              className={styles.inventory_card}
            >
              <div className={styles.icon_box}>
                {iconMap[itemMeta.icon] || '📦'}
              </div>

              <div className={styles.item_info}>
                <span className={styles.item_name}>
                  {itemMeta.title}
                </span>

                {isTicket ? (
                  <span className={styles.ticket_counter}>
                    <MdConfirmationNumber
                      className={styles.ticket_icon}
                    />
                    Осталось попыток:{' '}
                    <strong>{invItem.quantity}</strong>
                  </span>
                ) : (
                  <span className={styles.status_active}>
                    <MdCheckCircle className={styles.check_icon} />
                    Активировано
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default UserInventoryList
