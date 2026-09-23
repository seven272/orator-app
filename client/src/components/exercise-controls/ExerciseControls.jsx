// components/exercise-controls/ExerciseControls.jsx
import React, { useState, useMemo } from 'react'
import {
  IoMdArrowRoundBack,
  IoMdArrowRoundForward,
} from 'react-icons/io'
import { FaCheck } from 'react-icons/fa'
import { FaVk } from 'react-icons/fa'
import { useDispatch, useSelector } from 'react-redux'

import {
  checkIsAuth,
  checkIsVkGuest,
} from '../../redux/slices/authSlice'
import {
  openGuestOffer,
  openPremiumOffer,
} from '../../redux/slices/exerciseSlice'

import { openViralModal } from '../../redux/slices/vkSlice'

// Импортируем конфигурационный массив со структурой всех тренажеров
import { All_EXERCISES } from '../../assets/mocks/exercises'
import { useVkEnvironment } from '../../hooks/useVkEnvironment'
import { shareExerciseResultToStory } from '../../utils/vk-utils/vkShareStory'
import { getGuestEnergy } from '../../utils/vk-utils/vkStorageEnergy'
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
  exAlias, // Передаем только текстовый алиас тренажера
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
  const [isSharing, setIsSharing] = useState(false)
  const [isEnergyChecking, setIsEnergyChecking] = useState(false)
  const { isVkEnvironment } = useVkEnvironment()

  // const isVkEnvironment = true

  const { user: profileUser } = useSelector((state) => state.profile)
  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)

  const isGuest = !isAuth || isVkGuest

  // Находим объект текущего тренажера с использованием сглаживания Object.values().flat()
  const currentExercise = useMemo(() => {
    if (!exAlias) return null
    return Object.values(All_EXERCISES)
      .flat()
      .find((ex) => ex?.alias === exAlias)
  }, [exAlias])

  // Высчитываем уровень и стоимость энергии на основе найденного объекта
  const exerciseLevel = currentExercise?.level || 1
  const cost = exerciseLevel === 2 ? 2 : 1
  const targetLevelKey = `LEVEL_${exerciseLevel}`

  // АСИНХРОННЫЙ ОБРАБОТЧИК: Защищен от повторных нажатий и адаптирован под ВК
  // const handleStart = async () => {
  //   if (isEnergyChecking) return
  //   setIsEnergyChecking(true)

  //   // 🔒 КЕЙС 1: ИЗОЛИРОВАННАЯ ЛОГИКА ДЛЯ ГОСТЕЙ (Списание на фронтенде)
  //   if (isGuest) {
  //     let currentEnergy = 3

  //     if (isVkEnvironment) {
  //       currentEnergy = await getGuestEnergy() // Из облака ВК [INDEX]
  //     } else {
  //       currentEnergy = localStorage.getItem('govorix_guest_energy')
  //         ? parseInt(localStorage.getItem('govorix_guest_energy'), 10)
  //         : 3
  //     }

  //     if (currentEnergy < cost) {
  //       dispatch(openGuestOffer())
  //       setIsEnergyChecking(false)
  //       return
  //     }

  //     // Списываем энергию за раунд ТОЛЬКО для гостей
  //     const newEnergy = currentEnergy - cost
  //     if (isVkEnvironment) {
  //       await setGuestEnergy(newEnergy) // В облако ВК [INDEX]
  //     } else {
  //       localStorage.setItem(
  //         'govorix_guest_energy',
  //         String(newEnergy),
  //       )
  //     }

  //     dispatch(syncGuestEnergy(newEnergy));

  //     onStart();
  //     setIsEnergyChecking(false);
  //     return;
  //   }

  //   // 🔒 КЕЙС 2: ЛОГИКА ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ (Только проверка баланса) [INDEX]
  //   if (profileUser?.isPremium) {
  //     onStart()
  //     setIsEnergyChecking(false)
  //     return
  //   }

  //   const allowed = profileUser?.dailyEnergy?.allowed ?? 15
  //   const used = profileUser?.dailyEnergy?.used ?? 0
  //   const availableEnergy = Math.max(0, allowed - used)

  //   // Блокировка при пустом баке: разводка Сайт / ВК [INDEX]
  //   if (availableEnergy < cost) {
  //     if (isVkEnvironment) {
  //       dispatch(openViralModal()) // Бесплатная зарядка в ВК [INDEX]
  //     } else {
  //       dispatch(openPremiumOffer()) // Окно оплаты на сайте
  //     }
  //     setIsEnergyChecking(false)
  //     return
  //   }

  //   // Запускаем раунд БЕЗ списания на фронтенде (спишет бэкенд при отправке результатов) [INDEX]
  //   onStart()
  //   setIsEnergyChecking(false)
  // }
  const handleStart = async () => {
    if (isEnergyChecking) return
    setIsEnergyChecking(true)

    // 🔒 КЕЙС 1: ГОСТИ (Только асинхронная проверка баланса)
    if (isGuest) {
      const currentEnergy = isVkEnvironment
        ? await getGuestEnergy()
        : parseInt(
            localStorage.getItem('govorix_guest_energy') || '3',
            10,
          )

      if (currentEnergy < cost) {
        dispatch(openGuestOffer())
        setIsEnergyChecking(false)
        return
      }

      onStart()
      setIsEnergyChecking(false)
      return
    }

    // 🔒 КЕЙС 2: АВТОРИЗОВАННЫЕ ПОЛЬЗОВАТЕЛИ (Только проверка баланса)
    if (profileUser?.isPremium) {
      onStart()
      setIsEnergyChecking(false)
      return
    }

    const allowed = profileUser?.dailyEnergy?.allowed ?? 15
    const used = profileUser?.dailyEnergy?.used ?? 0
    const availableEnergy = Math.max(0, allowed - used)

    if (availableEnergy < cost) {
      if (isVkEnvironment) {
        dispatch(openViralModal())
      } else {
        dispatch(openPremiumOffer())
      }
      setIsEnergyChecking(false)
      return
    }

    onStart()
    setIsEnergyChecking(false)
  }

  //  ИМЕНОВАННЫЙ ОБРАБОТЧИК 3: Клик по кнопке «Продолжить» (Жесткий щит от бесконечных кругов)
  const handleNextRound = async () => {
    // Блокировка для незарегистрированных гостей в ВК/На сайте
    if (isGuest) {
      const currentEnergy = isVkEnvironment
        ? await getGuestEnergy()
        : parseInt(
            localStorage.getItem('govorix_guest_energy') || '3',
            10,
          )

      if (currentEnergy < cost) {
        dispatch(openGuestOffer()) // Выбрасываем окно авторизации
        return // ⛔ Жесткое прерывание, на следующий круг не пускаем!
      }
    }

    // 🔒 КЕЙС Б: Блокировка для авторизованных пользователей без Premium
    if (!isGuest && !profileUser?.isPremium) {
      const allowed = profileUser?.dailyEnergy?.allowed ?? 15
      const used = profileUser?.dailyEnergy?.used ?? 0
      const availableEnergy = Math.max(0, allowed - used)

      if (availableEnergy < cost) {
        dispatch(
          isVkEnvironment ? openViralModal() : openPremiumOffer(),
        )
        return // ⛔ Жесткое прерывание
      }
    }

    // Если все проверки пройдены — сбрасываем состояние экрана и идем на новый круг
    onNext()
  }

  const handleShareStory = async () => {
    if (!currentExercise || isSharing) return
    setIsSharing(true)

    await shareExerciseResultToStory(currentExercise)
    setIsSharing(false)
  }

  return (
    <div className={styles.btns_wrap}>
      {/* Кнопка Старт */}
      {status === STATUS.IDLE && (
        <button className={styles.btn_start} onClick={handleStart}>
          Начать задание
        </button>
      )}

      {/* Кнопки во время выполнения */}
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

      {/* Блок ручной самооценки */}
      {status === STATUS.FINISHED &&
        xp === 0 &&
        !isTaskInterrupted && (
          <div className={styles.btns_finished_wrap}>
            {SCORING_DATA[targetLevelKey]?.map((option) => (
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

      {/* Блок финальной навигации и шеринга */}
      {status === STATUS.FINISHED &&
        (xp !== 0 || isTaskInterrupted) && (
          <div className={styles.btns_end_container}>
            <div className={styles.btns_finished_wrap}>
              <button className={styles.btn_end} onClick={onFinish}>
                <IoMdArrowRoundBack size={18} />
                Закончить
              </button>
              <button
                className={styles.btn_next}
                onClick={handleNextRound}
              >
                Продолжить
                <IoMdArrowRoundForward size={18} />
              </button>
            </div>
            {/* Кнопка Истории отображается строго в ВК и только при успешном завершении */}
            {isVkEnvironment && !isTaskInterrupted && (
              <button
                className={styles.btn_share}
                onClick={handleShareStory}
                disabled={isSharing}
              >
                <FaVk size={18} /> Поделиться результатом
              </button>
            )}
          </div>
        )}
    </div>
  )
}

export default ExerciseControls
