import { useSelector } from 'react-redux'

import styles from './AuthPage.module.css'
import AuthForm from './auth-form/AuthForm'
import UserProfile from './user-profile/UserProfile'

import { checkIsAuth } from '../../redux/slices/authSlice'

const AuthPage = () => {
  // Читаем статус авторизации из Redux
  const isAuth = useSelector(checkIsAuth)

  return (
    <div className={styles.main}>
      {/* Если НЕ авторизован — показываем форму входа/регистрации */}
      {!isAuth ? <AuthForm /> : <UserProfile />}
    </div>
  )
}

export default AuthPage
