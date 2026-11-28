import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TbBook2, TbCalendarEvent } from 'react-icons/tb'

import shopIcon from '../../../assets/images/other/shop-icon.png'
import challengesIcon from '../../../assets/images/other/challenges-icon.png'
import duelsIcon from '../../../assets/images/other/duels-icon.png'
import styles from './ActivityBlock.module.css'

// Гибкая конфигурация пунктов: включайте/выключайте через isVisible
const ACTIVITY_ITEMS = [
  {
    id: 'shop',
    title: 'МАГАЗИН',
    subtitle: 'Жетоны и бусты',
    accentColor: '#2e7d32',
    iconSrc: shopIcon,
    link: '/shop',
    isVisible: true,
  },
  {
    id: 'challenges',
    title: 'ЧЕЛЛЕНДЖИ',
    subtitle: 'Практика в жизни',
    accentColor: '#e65100',
    iconSrc: challengesIcon,
    link: '/challenges',
    isVisible: true,
  },
  {
    id: 'duels',
    title: 'ДУЭЛИ',
    subtitle: 'Живые дискуссии',
    accentColor: '#c2185b',
    iconSrc: duelsIcon,
    link: '/live-duel',
    isVisible: true,
  },
  {
    id: 'knowledge',
    title: 'БАЗА ЗНАНИЙ',
    subtitle: 'Статьи и разборы',
    accentColor: '#007aff',
    IconComponent: TbBook2,
    link: '/hub/knowledge',
    isVisible: false, 
  },
  {
    id: 'events',
    title: 'АФИША',
    subtitle: 'Встречи и практикумы',
    accentColor: '#d86b14',
    IconComponent: TbCalendarEvent,
    link: '/hub/events',
    isVisible: false, 
  },
]

const ActivityBlock = () => {
  const navigate = useNavigate()

  const visibleItems = ACTIVITY_ITEMS.filter((item) => item.isVisible)

  if (visibleItems.length === 0) {
    return null
  }

  return (
    <section className={styles.activity_block}>
      <h2 className={styles.block_title}>🌟 ДОПОЛНИТЕЛЬНО</h2>

      <div className={styles.block_grid}>
        {visibleItems.map((item) => {
          const { IconComponent } = item

          return (
            <button
              key={item.id}
              type="button"
              className={styles.block_item}
              style={{ '--item-accent': item.accentColor }}
              onClick={() => navigate(item.link)}
            >
              <div className={styles.badge_wrapper}>
                {item.iconSrc ? (
                  <img
                    src={item.iconSrc}
                    alt={item.title}
                    className={styles.item_icon}
                  />
                ) : (
                  IconComponent && (
                    <span className={styles.vector_icon_wrap}>
                      <IconComponent size={20} />
                    </span>
                  )
                )}
                <span className={styles.badge_text}>{item.title}</span>
              </div>

              <span className={styles.item_subtitle}>{item.subtitle}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

export default ActivityBlock
