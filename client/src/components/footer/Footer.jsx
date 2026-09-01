import React, { useEffect, useState } from 'react'
import {
  FaBasketShopping,
  FaPeopleGroup,
  FaDumbbell,
} from 'react-icons/fa6'
import { LuSwords } from 'react-icons/lu'
import { PiStudent } from 'react-icons/pi'
import styles from './Footer.module.css'

import { useNavigate, useLocation } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const [year, setYear] = useState('')

  useEffect(() => {
    const dateObj = new Date()
    const yearNow = dateObj.getUTCFullYear()
    setYear(yearNow)
  }, [])

  return (
    <footer className={styles.footer_container}>
      {/* 🧭 Верхний уровень: Основная навигация */}
      <ul className={styles.btns}>
        {/* 📌 Упражнения (Каталог) */}
        <li
          className={`${styles.btn} ${location.pathname === '/exercises-all' || location.pathname.startsWith('/exercises-all') ? styles.active : ''}`}
          onClick={() => navigate('/exercises-all')}
        >
          <FaDumbbell size={22} className={styles.btn_icon} />
          <span className={styles.btn_title}>Упражнения</span>
        </li>

        {/* 📌 Курсы */}
        <li
          className={`${styles.btn} ${
            location.pathname.startsWith('/courses') ||
            location.pathname.startsWith('/course')
              ? styles.active
              : ''
          }`}
          onClick={() => navigate('/courses')}
        >
          <PiStudent size={22} className={styles.btn_icon} />
          <span className={styles.btn_title}>Курсы</span>
        </li>

        {/* 📌 Живые дуэли */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/live-duel') ? styles.active : ''}`}
          onClick={() => navigate('/live-duel')}
        >
          <LuSwords size={22} className={styles.btn_icon} />
          <span className={styles.btn_title}>Видео-дуэли</span>
        </li>

        {/* 📌 Реальные испытания */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/challenges') ? styles.active : ''}`}
          onClick={() => navigate('/challenges')}
        >
          <FaPeopleGroup size={22} className={styles.btn_icon} />
          <span className={styles.btn_title}>Челленджи</span>
        </li>

        {/* 📌 Магазин */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/shop') ? styles.active : ''}`}
          onClick={() => navigate('/shop')}
        >
          <FaBasketShopping size={22} className={styles.btn_icon} />
          <span className={styles.btn_title}>Магазин</span>
        </li>
      </ul>

      {/* ⚖️ Нижний уровень: Элегантная юридическая плашка */}
      <div className={styles.legal_block}>
        <span className={styles.copyright}>© {year} GovoriX</span>
        <span className={styles.divider}>|</span>
        <span
          className={styles.legal_link}
          onClick={() => navigate('/offer')}
        >
          оферта
        </span>
      </div>
    </footer>
  )
}

export default Footer
