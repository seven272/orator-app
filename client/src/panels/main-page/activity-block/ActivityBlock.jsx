import React from 'react'
import { useNavigate } from 'react-router-dom'

import shopIcon from '../../../assets/images/other/shop-icon.png';
import challengesIcon from '../../../assets/images/other/challenges-icon.png';
import duelsIcon from '../../../assets/images/other/duels-icon.png';
import styles from './ActivityBlock.module.css'

const ActivityBlock = () => {
  const navigate = useNavigate()
  // Конфигурация модулей с указанием целевых панелей для роутинга VK
  const blockItems = [
    {
      id: 'shop',
      title: 'МАГАЗИН',
      subtitle: 'Жетоны и бусты',
      type_class: styles.type_shop,
      icon: shopIcon,
      link: '/shop',
    },
    {
      id: 'challenges',
      title: 'ЧЕЛЛЕНДЖИ',
      subtitle: 'Практика в жизни',
      type_class: styles.type_challenges,
      icon: challengesIcon,
      link: '/challenges',
    },
    {
      id: 'duels',
      title: 'ДУЭЛИ',
      subtitle: 'Видео-дискуссии',
      type_class: styles.type_duels,
      icon: duelsIcon,
      link: '/live-duel',
    },
  ]

  const handleNavigate = (link) => {
    // Стандартный переход VK Bridge, либо замените на router.push(panelId) вашего VK-роутера
    navigate(link)
  }

  return (
    <section className={styles.activity_block}>
      <h2 className={styles.block_title}>🌟 ДОПОЛНИТЕЛЬНО</h2>

      <div className={styles.block_grid}>
        {blockItems.map((item) => (
          <button
            key={item.id}
            className={`${styles.block_item} ${item.type_class}`}
            onClick={() => handleNavigate(item.link)}
          >
            <div className={styles.badge_wrapper}>
              <img src={item.icon} alt={item.title} className={styles.item_icon} />
              <span className={styles.badge_text}>{item.title}</span>
            </div>
            <span className={styles.item_subtitle}>
              {item.subtitle}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

export default ActivityBlock
