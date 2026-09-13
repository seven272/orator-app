import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'

import styles from './Header.module.css'
import DropdownMenu from '../dropdown-menu/DropdownMenu'
import AvatarOrPlaceholder from '../avatar-or-placeholder/AvatarOrPlaceholder'
import {
  checkIsAuth,
  checkIsVkGuest,
  fetchVkRegister,
} from '../../redux/slices/authSlice'
import logoImg from '../../assets/images/design/logo.png'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // 📌 Данные игрового прогресса (уровень, опыт)
  const { user: profileUser } = useSelector((state) => state.profile)

  // 📌 Данные аккаунта и флаг Гостя из нашего обновленного authSlice
  const { user: authUser } = useSelector((state) => state.auth)
  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)

  // 📌 Хэндлер ручной регистрации в 1 клик для гостя ВК
  const handleFastVkRegister = async () => {
    const launchParams = window.location.search

    try {
      // Отправляем параметры запуска на наш новый изолированный эндпоинт бэкенда
      await dispatch(fetchVkRegister({ launchParams })).unwrap()
      message.success(
        'Аккаунт успешно создан! Ваш прогресс сохранен в MongoDB.',
      )
    } catch (error) {
      message.error(error || 'Не удалось создать аккаунт')
    }
  }

  return (
    <div className={styles.header}>
      <div className={styles.header_wrapper}>
        {/* Левый блок (Меню + Логотип) */}
        <div className={styles.left_block}>
          <DropdownMenu />
          <div
            className={styles.logo_wrap}
            onClick={() => navigate('/', { replace: true })}
          >
            <span className={styles.logo_title}>
              Govori
              <img
                src={logoImg}
                alt="X"
                className={styles.logo_x_img}
              />
            </span>
          </div>
        </div>

        {/* Правый блок */}
        <div className={styles.right_block}>
          {/* 🔥 1. ЕСЛИ ЭТО ГОСТЬ ИЗ ВК — СРАЗУ РЕНДЕРИМ КНОПКУ РЕГИСТРАЦИИ */}
          {isVkGuest ? (
            <button
              type="button"
              className={styles.vk_register_btn}
              onClick={handleFastVkRegister}
            >
              <span className={styles.vk_btn_icon}>🎁</span> Создать
              аккаунт
            </button>
          ) : isAuth ? (
            /* 😎 2. ЕСЛИ ПОЛНОЦЕННЫЙ ЮЗЕР (Вошел по Email или уже зарегистрирован в ВК) */
            <div className={styles.profile_widget}>
              <div
                className={styles.status_badge}
                onClick={() => navigate('/dashboard')}
              >
                {profileUser?.level && (
                  <>
                    <span
                      className={`${styles.status_text} ${styles.level_full}`}
                    >
                      Lvl {profileUser.level}
                    </span>
                    <span
                      className={`${styles.status_text} ${styles.level_short}`}
                    >
                      Lvl {profileUser.level}
                    </span>
                  </>
                )}
                {profileUser?.level &&
                  profileUser?.xp !== undefined && (
                    <span className={styles.divider}>|</span>
                  )}
                {profileUser?.xp !== undefined && (
                  <span className={styles.status_text}>
                    {profileUser.xp} XP
                  </span>
                )}
              </div>

              <AvatarOrPlaceholder
                user={authUser}
                sizeClass="size_s"
                onClick={() => navigate('/profile')}
              />
            </div>
          ) : (
            /* 🔒 3. АНОНИМНЫЙ ПОСЕТИТЕЛЬ С САЙТА */
            <AvatarOrPlaceholder
              user={null}
              sizeClass="size_s"
              onClick={() => navigate('/auth')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
