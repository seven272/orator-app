import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { message } from 'antd'

import styles from './Header.module.css'
import DropdownMenu from '../dropdown-menu/DropdownMenu'
import AvatarOrPlaceholder from '../avatar-or-placeholder/AvatarOrPlaceholder'
import { checkIsAuth, fetchVkRegister } from '../../redux/slices/authSlice'
import logoImg from '../../assets/images/design/logo.png'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // 📌 Данные игрового прогресса (уровень, опыт)
  const { user: profileUser } = useSelector((state) => state.profile)
  
  // 📌 Данные аккаунта и флаг Гостя из нашего обновленного authSlice
  const { user: authUser, isGuest } = useSelector((state) => state.auth)
  const isAuth = useSelector(checkIsAuth)

  // 📌 Хэндлер ручной регистрации в 1 клик для гостя ВК
  const handleFastVkRegister = async () => {
    const launchParams = window.location.search
    
    try {
      // Отправляем параметры запуска на наш новый изолированный эндпоинт бэкенда
      await dispatch(fetchVkRegister({ launchParams })).unwrap()
      message.success('Аккаунт успешно создан! Ваш прогресс сохранен в MongoDB.')
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
              <img src={logoImg} alt="X" className={styles.logo_x_img} />
            </span>
          </div>
        </div>

        {/* Правый блок (Управление профилем / Регистрация) */}
        <div className={styles.right_block}>
          {isAuth ? (
            isGuest ? (
              /* 🔥 ТВОЙ НОВЫЙ СЦЕНАРИЙ: Пользователь зашел из ВК, но он еще ГОСТЬ */
              <button 
                type="button" 
                className={styles.vk_register_btn}
                onClick={handleFastVkRegister}
              >
                <span className={styles.vk_btn_icon}>🎁</span> Создать аккаунт
              </button>
            ) : (
              /* Пользователь уже полноценно зарегистрирован в СУБД (не гость) */
              <div className={styles.profile_widget}>
                <div
                  className={styles.status_badge}
                  onClick={() => navigate('/dashboard')}
                >
                  {profileUser?.level && (
                    <>
                      <span className={`${styles.status_text} ${styles.level_full}`}>
                        Lvl {profileUser.level}
                      </span>
                      <span className={`${styles.status_text} ${styles.level_short}`}>
                        Lvl {profileUser.level}
                      </span>
                    </>
                  )}
                  {profileUser?.level && profileUser?.xp !== undefined && (
                    <span className={styles.divider}>|</span>
                  )}
                  {profileUser?.xp !== undefined && (
                    <span className={styles.status_text}>
                      {profileUser.xp} XP
                    </span>
                  )}
                </div>

                {/* Клик по аватару теперь ведет на страницу профиля / личного кабинета (AuthPage / UserProfile) */}
                <AvatarOrPlaceholder
                  user={authUser}
                  sizeClass="size_s"
                  onClick={() => navigate('/auth')}
                />
              </div>
            )
          ) : (
            /* Сценарий для обычного неавторизованного посетителя с Сайта */
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
