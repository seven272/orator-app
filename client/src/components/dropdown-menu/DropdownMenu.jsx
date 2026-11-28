import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { TfiMenu } from 'react-icons/tfi'
import { FaRegHandPointRight } from 'react-icons/fa'
import { useNavigate, useLocation } from 'react-router-dom'

import styles from './DropdownMenu.module.css'

const MENU_ITEMS = [
  { title: 'главная', path: '/' },
  { title: 'статистика', path: '/dashboard' },
  { title: 'тренажеры', path: '/exercises-all' },
  { title: 'курсы', path: '/courses' },
  { title: 'живая дуэль', path: '/live-duel' },
  { title: 'рейтинг и лента', path: '/community' },
  { title: 'испытания', path: '/challenges' },
  { title: 'магазин', path: '/shop' },
  // { title: 'база знаний', path: '/hub/knowledge' },
  // { title: 'афиша', path: '/hub/events' },
]

const DropdownMenu = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })

  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  // Вычисляем координаты кнопки на экране для позиционирования портала
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setCoords({
      top: rect.bottom + 10,
      left: Math.max(8, rect.left),
    })
  }, [])

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen((prev) => !prev)
  }

  // Закрытие по клику вне кнопки/меню, по Escape и пересчет позиции при ресайзе/скролле
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event) => {
      const clickedInsideTrigger =
        triggerRef.current && triggerRef.current.contains(event.target)
      const clickedInsideMenu =
        menuRef.current && menuRef.current.contains(event.target)

      if (!clickedInsideTrigger && !clickedInsideMenu) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, updatePosition])

  const handleSelectItem = (path) => {
    setIsOpen(false)
    navigate(path, { replace: true })
  }

  const isItemActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className={styles.dropdown_container}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger_btn}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-label="Открыть меню навигации"
      >
        <TfiMenu className={styles.icon} />
      </button>

      {isOpen &&
        createPortal(
          <ul
            ref={menuRef}
            className={styles.dropdown_list}
            role="menu"
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
          >
            {MENU_ITEMS.map((item) => {
              const active = isItemActive(item.path)
              return (
                <li key={item.path} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className={`${styles.dropdown_item} ${
                      active ? styles.dropdown_item_active : ''
                    }`}
                    onClick={() => handleSelectItem(item.path)}
                  >
                    <FaRegHandPointRight className={styles.item_icon} />
                    <span className={styles.item_title}>{item.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>,
          document.body
        )}
    </div>
  )
}

export default DropdownMenu
