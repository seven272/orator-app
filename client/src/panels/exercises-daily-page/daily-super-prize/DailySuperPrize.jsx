import React, { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FaGift, FaLock, FaCheckCircle } from 'react-icons/fa'
import { message } from 'antd'

import { fetchClaimSuperPrize } from '../../../redux/slices/dailySlice'
import WeeklyPrizeModal from '../../../components/modal/weekly-prize-modal/WeeklyPrizeModal'
import styles from './DailySuperPrize.module.css'

const DailySuperPrize = () => {
  const dispatch = useDispatch()
  const [showPrizeModal, setShowPrizeModal] = useState(false)

  // 1. Извлекаем нужные данные из сторов геймификации и профиля
  const { isDemo, prizeLoading, claimedPrizeData } = useSelector(
    (state) => state.daily || {},
  )
  const user = useSelector((state) => state.profile?.user || {})
  const completedDays = user.completed_days || []
  const lastWeeklyRewardDate = user.lastWeeklyRewardDate || ''

  // 2. Рассчитываем текущие даты недели для валидации кнопок на фронтенде
  const today = new Date()
  const currentDay = today.getDay()
  const dayIndex = currentDay === 0 ? 6 : currentDay - 1

  const monday = new Date(today)
  monday.setDate(today.getDate() - dayIndex)

  // Формируем строковый массив дней текущей недели Пн-Вс
  const currentWeekDays = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    currentWeekDays.push(day.toISOString().split('T')[0])
  }

  const sundayStr = currentWeekDays[6] // Дата воскресенья текущей недели

  // Проверяем идеальное прохождение всей недели
  const isWeekPerfect = currentWeekDays.every((date) =>
    completedDays.includes(date),
  )
  // ЗНАЧЕНИЯ ДЛЯ ТЕСТА:
  // const isWeekPerfect = true

  // Проверяем статус получения
  const isAlreadyClaimed = lastWeeklyRewardDate === sundayStr
  // ЗНАЧЕНИЯ ДЛЯ ТЕСТА:
  // const isAlreadyClaimed = false // Сундук НИКОГДА не отображается закрытым/взятым

  // Кнопка активна только в воскресенье (или в пн за прошлую неделю), если все дни закрыты и сундук еще не взят
  const canOpenChest = isWeekPerfect && !isAlreadyClaimed && !isDemo
  // ЗНАЧЕНИЯ ДЛЯ ТЕСТА:
  // const canOpenChest = true // Кнопка активна ВСЕГДА

  const handleOpenChest = async () => {
    if (!canOpenChest) return
    try {
      await dispatch(fetchClaimSuperPrize()).unwrap()
      setShowPrizeModal(true) // Открываем модальное окно с выигранным призом
    } catch (err) {
      message.error(err || 'Произошла ошибка')
    }
  }

  // Если пользователь гость — мягко напоминаем о призе, но скрываем интерактив
  if (isDemo) {
    return (
      <section className={styles.prize_container}>
        <div className={styles.card_disabled}>
          <div className={styles.icon_box_locked}>
            <FaLock size={24} />
          </div>
          <div className={styles.info}>
            <h3 className={styles.card_title}>
              🎁 ГЛАВНЫЙ ПРИЗ НЕДЕЛИ
            </h3>
            <p className={styles.description}>
              Занимайтесь риторикой 7 дней подряд без пропусков, чтобы
              открыть Призовой Сундук! Войдите в профиль для участия.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.prize_container}>
      <h2 className={styles.section_title}>Главный приз недели</h2>

      <div
        className={`${styles.prize_card} ${isAlreadyClaimed ? styles.card_claimed : canOpenChest ? styles.card_ready : ''}`}
      >
        {/* Визуальная часть сундука */}
        <div
          className={`${styles.chest_visual} ${canOpenChest ? styles.pulse_animation : ''} ${isAlreadyClaimed ? styles.chest_opened : ''}`}
        >
          {isAlreadyClaimed ? (
            <FaCheckCircle
              size={32}
              className={styles.success_icon}
            />
          ) : (
            <FaGift size={32} />
          )}
        </div>

        {/* Контентная информация */}
        <div className={styles.info_block}>
          <p className={styles.description_text}>
            {isAlreadyClaimed
              ? 'Поздравляем! Вы полностью закрыли неделю тренировок и забрали свой заслуженный подарок. Новая неделя начнется в понедельник!'
              : canOpenChest
                ? 'Потрясающе! Вы проявили идеальную дисциплину и занимались всю неделю без единого пропуска. Откройте ваш сундук прямо сейчас!'
                : 'Выполняйте хотя бы одно задание дня с понедельника по воскресенье. В конце недели сундук откроется и вы сможете выиграть жетоны оратора, уникальную ачивку, купоны на ИИ-тренажеры или целый обучающий курс!'}
          </p>

          {/* Кнопка действия */}
          {!isAlreadyClaimed && (
            <button
              className={styles.action_button}
              disabled={!canOpenChest || prizeLoading}
              onClick={handleOpenChest}
            >
              {prizeLoading
                ? 'Открытие...'
                : canOpenChest
                  ? 'Открыть Призовой Сундук'
                  : 'Сундук заблокирован'}
            </button>
          )}
        </div>
      </div>

      {/* 🎉 МОДАЛЬНОЕ ОКНО ПРИЗА */}
      <WeeklyPrizeModal
        isOpen={showPrizeModal}
        onClose={() => setShowPrizeModal(false)}
        prizeData={claimedPrizeData}
      />
    </section>
  )
}

export default DailySuperPrize
