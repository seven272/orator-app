import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

import styles from './Header.module.css'
import DropdownMenu from '../dropdown-menu/DropdownMenu'
import AvatarOrPlaceholder from '../avatar-or-placeholder/AvatarOrPlaceholder'
import { checkIsAuth } from '../../redux/slices/authSlice'
import logoImg from '../../assets/images/design/logo.png'

const Header = () => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.profile)
  const authUser = useSelector((state) => state.auth.user)
  const isAuth = useSelector(checkIsAuth)

  return (
    <div className={styles.header}>
      <div className={styles.header_wrapper}>
        {/* Левый блок теперь объединяет меню и логотип на смартфонах */}
        <div className={styles.left_block}>
          <DropdownMenu />
          <div
            className={styles.logo_wrap}
            onClick={() => navigate('/', { replace: true })}
          >
          <span className={styles.logo_title}>
    Govori
    {/* Логотип-птица теперь находится внутри строки вместо текстовой Х */}
    <img src={logoImg} alt="X" className={styles.logo_x_img} />
  </span>
          </div>
        </div>

        <div className={styles.right_block}>
          {isAuth ? (
            <div className={styles.profile_widget}>
              <div
                className={styles.status_badge}
                onClick={() => navigate('/dashboard')}
              >
                {user?.level && (
                  <>
                    {/* На больших экранах пишем полностью, на маленьких — "Ур." */}
                    <span
                      className={`${styles.status_text} ${styles.level_full}`}
                    >
                      Lvl {user.level}
                    </span>
                    <span
                      className={`${styles.status_text} ${styles.level_short}`}
                    >
                      Lvl {user.level}
                    </span>
                  </>
                )}
                {user?.level && user?.xp !== undefined && (
                  <span className={styles.divider}>|</span>
                )}
                {user?.xp !== undefined && (
                  <span className={styles.status_text}>
                    {user.xp} XP
                  </span>
                )}
              </div>

              {/* Исправлено: заменено на sizeClass по правилу camelCase */}
              <AvatarOrPlaceholder
                user={authUser}
                sizeClass="size_s"
                onClick={() => navigate('/auth')}
              />
            </div>
          ) : (
            /* ДОБАВЛЕНО: Заглушка или кнопка входа, если пользователь не авторизован */
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
