import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import styles from './AuthPage.module.css'
import AuthForm from './auth-form/AuthForm'
import { checkIsAuth } from '../../redux/slices/authSlice'

const AuthPage = () => {
  const navigate = useNavigate()
  const isAuth = useSelector(checkIsAuth)

  // 🔥 РЕДИРЕКТ: Если пользователь уже залогинен, ему нечего делать на странице входа
  useEffect(() => {
    if (isAuth) {
      navigate('/profile', { replace: true })
    }
  }, [isAuth, navigate])

  return (
    <div className={styles.main}>
      {/* Рендерим форму входа/регистрации (пока идет проверка, useEffect перебросит если надо) */}
      {!isAuth && <AuthForm />}
    </div>
  )
}

export default AuthPage
