
import { useNavigate } from 'react-router-dom'
import { useSelector , useDispatch} from 'react-redux'
import { FaCheckSquare } from 'react-icons/fa'

import { All_EXERCISES } from '../../../../assets/mocks/exercises'
import styles from './DailyTaskCard.module.css'
import {
  checkIsVkGuest,
  fetchVkRegister,
} from '../../../../redux/slices/authSlice' // Импортируем нужные экшены/селекторы
import { openPremiumModal } from '../../../../redux/slices/profileSlice' // На случай клика по Premium

const DailyTaskCard = ({ task }) => {
  const {
    alias,
    title,
    description,
    reward,
    goal,
    currentValue,
    isCompleted, 
    locked,
  } = task
  const navigate = useNavigate()
  const dispatch = useDispatch()
 

  // 🚀 Проверяем демо-режим напрямую в карточке для стабильности клика
  const { isDemo } = useSelector((state) => state.daily || {})
  const isVkGuest = useSelector(checkIsVkGuest)

  const exerciseConfig = Object.values(All_EXERCISES)
    .flat()
    .find((ex) => ex.alias === alias)

  const iconSrc = exerciseConfig?.icon

  const handleClick = async () => {
    // 🎲 Обработка ДЕМО-РЕЖИМА (Гость)
    if (isDemo) {
      if (isVkGuest) {
        try {
          // 🚀 Ленивая бесшовная регистрация для ВК-гостя прямо по клику на квест
          await dispatch(fetchVkRegister()).unwrap()
          // После успешного апдейта стейт обновится, и при следующем клике задание откроется
        } catch (err) {
          console.error(
            'Ошибка автоматической регистрации в ВК:',
            err,
          )
        }
      } else {
        // Обычного анонима с сайта отправляем на стандартную форму
        navigate('/auth')
      }
      return
    }

    // 🔒 Клиентская обработка Premium-кликa
    if (locked) {
      dispatch(openPremiumModal()) // Вместо console.log открываем модалку покупки подписки
      return
    }

    if (isCompleted) return

    navigate(`/exercise/${alias}?daily=true`)
  }

  const cardClasses = [
    styles.card,
    locked ? styles.locked : '',
    isCompleted ? styles.completed : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses} onClick={handleClick}>
      {locked && <div className={styles.premium_badge}>Premium</div>}

      <div className={styles.icon_wrapper}>
        {iconSrc && (
          <img src={iconSrc} alt={title} className={styles.icon} />
        )}
      </div>

      <div className={styles.content}>
        <span className={styles.task_title}>{title}</span>
        <span className={styles.description}>
          {isDemo
            ? 'Войди в аккаунт, чтобы активировать этот квест'
            : description}
        </span>
      </div>

      <div className={styles.side_info}>
        <span className={styles.reward}>+{reward} XP</span>

        {isDemo ? (
    // 🎯 Если это демо-режим, гостю всегда бескомпромиссно выводим замок
    <span className={styles.progress_label}>🔒</span>
  ) : isCompleted ? (
    <span className={styles.check_icon}>
      <FaCheckSquare size={20} /> выполнено
    </span>
  ) : (
    // Для авторизованных: выводим прогресс, только если задача не заблокирована премиумом
    !locked && (
      <span className={styles.progress_label}>
        {currentValue}/{goal}
      </span>
    )
  )}
      </div>
    </div>
  )
}

export default DailyTaskCard
