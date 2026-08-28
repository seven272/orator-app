import React, { useEffect, useState } from 'react'
import { FaBasketShopping, FaPeopleGroup } from 'react-icons/fa6'
import { LuSwords } from 'react-icons/lu'
import { PiStudent } from 'react-icons/pi'
import styles from './Footer.module.css'

// 📌 Импортируем useLocation для отслеживания текущего пути URL
import { useNavigate, useLocation } from 'react-router-dom'

const Footer = () => {
  const navigate = useNavigate()
  const location = useLocation() // 📌 Получаем объект текущего пути

  const [year, setYear] = useState('')

  // Получаем текущий год
  useEffect(() => {
    const dateObj = new Date()
    const yearNow = dateObj.getUTCFullYear()
    setYear(yearNow)
  }, [])

  return (
    <footer className={styles.footer}>
      <ul className={styles.btns}>
        {/* 📌 Магазин: активен, если путь содержит /shop */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/shop') ? styles.active : ''}`}
          onClick={() => navigate('/shop')}
        >
          <FaBasketShopping size={25} className={styles.btn_icon} />
          <span className={styles.btn_title}>Магазин</span>
        </li>

        {/* 📌 Реальные испытания: активны, если путь содержит /challenges */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/challenges') ? styles.active : ''}`}
          onClick={() => navigate('/challenges')}
        >
          <FaPeopleGroup size={25} className={styles.btn_icon} />
          <span className={styles.btn_title}>Реальные испытания</span>
        </li>

        {/* 📌 Живые дуэли: активны, если путь содержит /live-duel */}
        <li
          className={`${styles.btn} ${location.pathname.startsWith('/live-duel') ? styles.active : ''}`}
          onClick={() => navigate('/live-duel')}
        >
          <LuSwords size={25} className={styles.btn_icon} />
          <span className={styles.btn_title}>Живые дуэли</span>
        </li>

        {/* 📌 Курсы: активны, если путь содержит /courses или /course/ */}
        <li
          className={`${styles.btn} ${
            location.pathname.startsWith('/courses') ||
            location.pathname.startsWith('/course')
              ? styles.active
              : ''
          }`}
          onClick={() => navigate('/courses')}
        >
          <PiStudent size={25} className={styles.btn_icon} />
          <span className={styles.btn_title}>Курсы</span>
        </li>
      </ul>
    </footer>
  )
}

export default Footer
