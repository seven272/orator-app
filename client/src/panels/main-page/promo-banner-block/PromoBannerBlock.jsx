import React, { useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'

import { All_EXERCISES } from '../../../assets/mocks/exercises'
import { fetchFeedEvents } from '../../../redux/slices/feedSlice' // 🔔 ДОБАВЛЕНО: Импорт экшена загрузки пульса
import styles from './PromoBannerBlock.module.css'
import birdImage from '../../../assets/images/design/3d_bird.png'

const PromoBannerBlock = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // 🔔 ДОБАВЛЕНО: Берем массив событий из слайса пульса
  const { events } = useSelector((state) => state.feed)
  // Нам нужно строго самое последнее (нулевое) событие в массиве
  const lastEvent = events?.[0] || null

  // Загружаем ленту при монтировании, если она еще пустая
  useEffect(() => {
    if (!events || events.length === 0) {
      dispatch(fetchFeedEvents())
    }
  }, [dispatch, events])

  // 🎲 Выбираем случайное упражнение строго из массива первого уровня
  const randomExercise = useMemo(() => {
    const level1Exercises = All_EXERCISES?.level1 || []
    if (level1Exercises.length === 0) return null

    const randomIndex = Math.floor(Math.random() * level1Exercises.length)
    return level1Exercises[randomIndex]
  }, [])

  // 🔔 Хелпер для генерации супер-короткого текста новости
 const getShortEventText = (event) => {
  if (!event) return null
  const name = event.author?.displayName || 'Спикер'
  const target = event.meta?.eventTargetName || ''
  
  switch (event.type) {
    case 'RANK_UP':
      return `🎙️ ${name} взял ранг ${event.meta?.newRank || 'Спикера'}!`;
    case 'CHALLENGE_DONE':
      return `🔥 ${name} сдал челлендж: «${target}»`;
    case 'PREMIUM_BUY':
      return `👑 ${name} перешел на Premium-статус!`;
    case 'STREAK_WEEK':
      return `⚡ ${name} тренируется ${event.meta?.streakDays || 7} дней подряд!`;
    case 'EXERCISE_TOP_SCORE':
      return `🎯 ${name} набрал рекордные ${event.meta?.score} баллов ИИ!`;
    case 'EXERCISE_MILESTONE':
      return `🏆 ${name} выполнил тренажер в ${event.meta?.completionsCount}-й раз!`;
    case 'ACHIEVEMENT_UNLOCKED':
      return `🏅 ${name} получил ачивку: «${target}»`;
    case 'COURSE_STARTED':
      return `🚀 ${name} начал прохождение интенсива: «${target}»`;
    case 'COURSE_COMPLETED':
      return `📜 ${name} успешно завершил курс: «${target}»`;
    case 'SHOP_PURCHASE':
      return `💰 ${name} купил «${target}» в магазине оратора!`;
    case 'WEEKLY_PRIZE':
      return `🎁 ${name} выиграл приз «${target}»!`;
    default:
      return `📢 Новая активность в комьюнити Govorix!`;
  }
}

  const shortNewsText = getShortEventText(lastEvent)

  if (!randomExercise) return null

  const { alias, title, description, icon, skill } = randomExercise

  const handleStartExercise = () => {
    if (alias) {
      navigate(`/exercise/${alias}`)
    }
  }

  // 🔔 ДОБАВЛЕНО: Обработчик клика по новостной строке
  const handleNewsClick = (evt) => {
    evt.stopPropagation() // 🛑 Важно: останавливаем всплытие клика, чтобы не запустилось упражнение!
    navigate('/community', { state: { defaultTab: 'feed' } }) // Перенаправляем на страницу рейтинга (где мы внедрили вкладку Живой ленты)
  }

  return (
    <section
      className={styles.banner_card}
      onClick={handleStartExercise}
      role="button"
      tabIndex={0}
    >
      {/* 🔔 ИЗМЕНЕНО: Обернули верхнюю часть баннера в горизонтальный контейнер main_row */}
      <div className={styles.main_row}>
        {/* Левая содержательная часть */}
        <div className={styles.content_side} id="click">
          <div className={styles.tag_row}>
            <span className={styles.tag}>
              ⚡ ГОВОРИКС РЕКОМЕНДУЕТ&nbsp;•
              {skill && (
                <span className={styles.skill_highlight}>
                  {' '}
                  ПРОКАЧКА: {skill.toUpperCase()}
                </span>
              )}
            </span>
          </div>

          <div className={styles.exercise_row}>
            {icon && (
              <img src={icon} alt="" className={styles.exercise_icon} />
            )}
            <h3 className={styles.title}>{title}</h3>
          </div>

          <p className={styles.description}>{description}</p>

          <div className={styles.action_link}>
            Начать практику <span className={styles.arrow}>→</span>
          </div>
        </div>

        {/* Правая иллюстративная часть с птичкой в углу */}
        <div className={styles.image_side}>
          <img
            src={birdImage}
            alt="GovoriX Mascot"
            className={styles.mascot_img}
          />
        </div>
      </div>

      {/* 🔔 ДОБАВЛЕНО: Интерактивная живая строка новости сообщества */}
      {shortNewsText && (
        <div className={styles.pulse_line} onClick={handleNewsClick} title="Посмотреть всю ленту активности">
          <span className={styles.pulse_dot} />
          <span className={styles.pulse_text}>{shortNewsText}</span>
          <span className={styles.pulse_arrow}>→</span>
        </div>
      )}
    </section>
  )
}

export default PromoBannerBlock
