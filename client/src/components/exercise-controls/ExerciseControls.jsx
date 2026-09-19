import React from 'react'
import {
  IoMdArrowRoundBack,
  IoMdArrowRoundForward,
} from 'react-icons/io'
import { FaCheck } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'
import {
  checkIsAuth,
  checkIsVkGuest,
} from '../../redux/slices/authSlice'
import {
  openGuestOffer,
  openPremiumOffer,
} from '../../redux/slices/exerciseSlice'
import styles from './ExerciseControls.module.css'

const SCORING_DATA = {
  LEVEL_1: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 15 },
    { label: 'Уверенно', value: 30 },
  ],
  LEVEL_2: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 25 },
    { label: 'Уверенно', value: 50 },
  ],
}

const ExerciseControls = ({
  status,
  level = 'LEVEL_2',
  STATUS,
  xp,
  isTaskInterrupted,
  onStart,
  onStop,
  onComplete,
  onRate,
  onFinish,
  onNext,
}) => {
  const dispatch = useDispatch()
  const { user: profileUser } = useSelector((state) => state.profile)
  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)
  // Пользователь считается гостем, если он не авторизован НА САЙТЕ ИЛИ является гостем ВК
  const isGuest = !isAuth || isVkGuest
  const cost = level === 'LEVEL_2' ? 2 : 1

  const handleStart = () => {
    // 🔒 КЕЙС 1: ЛОГИКА ДЛЯ ГОСТЕЙ (Обычных сайта и Гостей ВК)
    if (isGuest) {
      const currentEnergy = localStorage.getItem(
        'govorix_guest_energy',
      )
        ? parseInt(localStorage.getItem('govorix_guest_energy'), 10)
        : 3

      if (currentEnergy < cost) {
        dispatch(openGuestOffer()) // Всплывает окно регистрации / входа
        return
      }

      onStart()
      return
    }

    // ЛОГИКА ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ
    // Если у пользователя есть безлимитный Premium — пускаем мгновенно без проверок [INDEX]
    if (profileUser?.isPremium) {
      onStart()
      return
    }

    // Если премиума нет — рассчитываем остаток энергии из Redux-данных профиля [INDEX]
    const allowed = profileUser?.dailyEnergy?.allowed ?? 15
    const used = profileUser?.dailyEnergy?.used ?? 0
    const availableEnergy = Math.max(0, allowed - used)

    if (availableEnergy < cost) {
      dispatch(openPremiumOffer()) // 🔥 БЛОКИРОВКА НА СТАРТЕ: Всплывает кастомное окно 
      return
    }

    // Если энергии в баке СУБД достаточно — пускаем выполнять раунд
    onStart()
  }

  return (
    <div className={styles.btns_wrap}>
      {/* Кнопка Старт */}
      {status === STATUS.IDLE && (
        <button className={styles.btn_start} onClick={handleStart}>
          Начать задание
        </button>
      )}

      {/* кнопки во время выполнения */}
      {status === STATUS.RUNNING && (
        <div className={styles.btns_finished_wrap}>
          <button
            type="button"
            className={styles.btn_stop}
            onClick={onStop}
          >
            Прервать
          </button>
          <button
            type="button"
            className={styles.btn_ready}
            onClick={onComplete}
          >
            Готово
            <FaCheck size={12} />
          </button>
        </div>
      )}

      {/* Блок оценки */}
      {status === STATUS.FINISHED &&
        xp === 0 &&
        !isTaskInterrupted && (
          <div className={styles.btns_finished_wrap}>
            {SCORING_DATA[`${level}`].map((option) => (
              <button
                key={option.value}
                onClick={() => onRate(option.value)}
                className={styles.btn_rate}
              >
                <span>{option.label}</span>
                <span>{option.value}xp</span>
              </button>
            ))}
          </div>
        )}

      {/* Кнопки Навигации (Закончить / Продолжить) */}
      {status === STATUS.FINISHED &&
        (xp !== 0 || isTaskInterrupted) && (
          <div className={styles.btns_finished_wrap}>
            <button className={styles.btn_end} onClick={onFinish}>
              <IoMdArrowRoundBack size={18} />
              Закончить
            </button>
            <button className={styles.btn_next} onClick={onNext}>
              Продолжить
              <IoMdArrowRoundForward size={18} />
            </button>
          </div>
        )}
    </div>
  )
}

export default ExerciseControls
