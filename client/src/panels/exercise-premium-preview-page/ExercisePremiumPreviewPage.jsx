import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { MdWorkspacePremium } from 'react-icons/md'
import {
  IoArrowBack,
  IoInformationCircleOutline,
} from 'react-icons/io5'
import { RiRobotLine } from 'react-icons/ri'

import styles from './ExercisePremiumPreviewPage.module.css'
import { All_EXERCISES } from '../../assets/data/exercises/exercises'
import Modal from '../../UI/modal/Modal'
import TheoryContent from '../../components/theory-content/TheoryContent'
import { openPremiumModal } from '../../redux/slices/profileSlice'
import {
  checkIsAuth,
  checkIsVkGuest,
  fetchVkRegister,
} from '../../redux/slices/authSlice'
import { useVkEnvironment } from '../../hooks/useVkEnvironment'

const ExercisePremiumPreviewPage = () => {
  const { alias } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isVkEnvironment } = useVkEnvironment()
  const [showTheory, setShowTheory] = useState(false)

  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)

  // Поиск тренажёра по alias во всех уровнях объекта All_EXERCISES
  const exercise = Object.values(All_EXERCISES)
    .flat()
    .find((ex) => ex.alias === alias)

  // Если тренажёр не найден, возвращаем пользователя назад
  if (!exercise) {
    return (
      <div className={styles.error_container}>
        <p className={styles.error_text}>Тренажёр не найден</p>
        <button
          className={styles.btn_error_back}
          onClick={() => navigate(-1)}
        >
          Вернуться назад
        </button>
      </div>
    )
  }

  const renderButton = () => {
    if (isVkEnvironment && isVkGuest) {
      return (
        <button
          type="button"
          className={styles.custom_btn_buy}
          onClick={() => dispatch(fetchVkRegister())}
        >
          Создать профиль и оформить премиум
        </button>
      )
    } else if (!isVkEnvironment && !isAuth) {
      return (
        <button
          type="button"
          className={styles.custom_btn_buy}
          onClick={() => navigate('/auth')}
        >
          Зарегистрироваться и оформить премиум
        </button>
      )
    } else {
      return (
        <button
          type="button"
          className={styles.custom_btn_buy}
          onClick={() => dispatch(openPremiumModal())}
        >
          Активировать Premium
        </button>
      )
    }
  }

  return (
    <div className={styles.page_container}>
      {/* Шапка страницы с нативной кнопкой Назад для ВК */}
      <header className={styles.header}>
        <button
          className={styles.btn_back}
          onClick={() => navigate(-1)}
        >
          <IoArrowBack />
        </button>
        <span className={styles.header_title}>Превью тренажёра</span>
      </header>

      {/* Основной контент */}
      <main className={styles.content}>
        {/* Анимированный премиум-бейдж */}
        <div className={styles.premium_badge}>
          <MdWorkspacePremium size={20} />
          <span>Продвинутая ИИ-версия</span>
        </div>

        {/* Большой красивый блок иконки */}
        <div className={styles.icon_large_wrap}>
          {exercise.icon ? (
            <img
              src={exercise.icon}
              alt={exercise.title}
              className={styles.ex_icon_png}
            />
          ) : (
            <span className={styles.fallback_emoji}>✨</span>
          )}
        </div>

        <h2 className={styles.title}>{exercise.title}</h2>

        <div className={styles.info_card}>
          <p className={styles.description}>
            {exercise.description}.
          </p>
      <p className={styles.ai_features}>
  <span className={styles.ai_title_wrap}>
    <RiRobotLine size={18} className={styles.ai_icon} />
    <strong>Преимущества:</strong>
  </span>
  <br />
  В этой версии искусственный интеллект полностью берёт на себя роль вашего личного наставника. 
  Он запишет аудиопоток, мгновенно разберёт структуру аргументов, укажет на речевые ошибки 
  и выдаст точную оценку по шкале ораторского мастерства.
</p>
        </div>

        {/* Интерактивные самописные кнопки действий */}
        <div className={styles.actions_block}>
          <button
            type="button"
            className={styles.custom_btn_theory}
            onClick={() => setShowTheory(true)}
          >
            <IoInformationCircleOutline size={20} />
            Изучить теорию упражнения
          </button>

          {renderButton()}
        </div>
      </main>

      {/* Модалка с теорией (откроется поверх страницы) */}
      <Modal active={showTheory} onClose={() => setShowTheory(false)}>
        <TheoryContent
          alias={exercise.alias}
          onClose={() => setShowTheory(false)}
        />
      </Modal>
    </div>
  )
}

export default ExercisePremiumPreviewPage
