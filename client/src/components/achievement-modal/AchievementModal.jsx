import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { clearLastAwarded } from '../../redux/slices/profileSlice'
import styles from './AchievementModal.module.css'
import { ALL_ACHIEVEMENTS } from '../../constants/achievements'
import defaultIcon from '../../assets/images/achievements/first_step.png'

const AchievementModal = () => {
  const dispatch = useDispatch()
  const lastAwarded = useSelector(
    (state) => state.profile.lastAwarded,
  ) 

  // Локальный стейт для создания задержки появления
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Если объект ачивки появился в Redux и у него есть код
    if (lastAwarded && lastAwarded.code) {
      const timer = setTimeout(() => {
        setShowModal(true)
      }, 1500) // ⏳ Задержка 1.5 секунды. Измените на 2000, если нужно еще медленнее

      return () => clearTimeout(timer)
    } else {
      setShowModal(false)
    }
  }, [lastAwarded])

  // Если в Redux ничего нет ИЛИ время таймера еще не вышло — окно скрыто
  if (!lastAwarded || !lastAwarded.code || !showModal) return null

  // Работаем с lastAwarded напрямую как с объектом
  const findedAch = ALL_ACHIEVEMENTS.find(
    (el) => el.code === lastAwarded.code,
  )
  const avatarSrc = findedAch ? findedAch.icon : defaultIcon

  return (
    <div
      className={styles.overlay}
      onClick={() => dispatch(clearLastAwarded())}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.shine} />
        <span className={styles.badge}>ПОЗДРАВЛЯЕМ!</span>

        <div className={styles.icon_container}>
          <img src={avatarSrc} className={styles.img} alt="award" />
        </div>

        <h2 className={styles.title}>{lastAwarded.title}</h2>
        <p className={styles.text}>
          Вы разблокировали новое достижение!
        </p>

        <button
          className={styles.btn}
          onClick={() => dispatch(clearLastAwarded())}
        >
          Забрать награду
        </button>
      </div>
    </div>
  )
}

export default AchievementModal
