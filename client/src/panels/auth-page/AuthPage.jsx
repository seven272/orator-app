import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'

import styles from './AuthPage.module.css'
import AuthForm from './auth-form/AuthForm'
import {
  checkIsAuth,
  fetchVkWebsiteAuth,
} from '../../redux/slices/authSlice'

const AuthPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const isAuth = useSelector(checkIsAuth)
  const [isProcessingVk, setIsProcessingVk] = useState(false)

  // 1. РЕДИРЕКТ: Если пользователь уже залогинен, уводим в профиль
  useEffect(() => {
    if (isAuth && !isProcessingVk) {
      navigate('/profile', { replace: true })
    }
  }, [isAuth, isProcessingVk, navigate])

  // 2. 🔥 ПЕРЕХВАТЧИК VK OAUTH PARAMETERS
useEffect(() => {
  const parseVkAuthCode = async () => {
    // 📌 ТЕПЕРЬ ЧИТАЕМ ИЗ ЧИСТОЙ СТРОКИ URL (Так как убрали хэш из редиректа!)
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const returnedState = urlParams.get('state')

    if (code) {
      setIsProcessingVk(true)
      try {
        // 📌 ЧИТАЕМ ИЗ SESSION_STORAGE (По твоему новому стандарту безопасности!)
        const codeVerifier = sessionStorage.getItem('vk_code_verifier')
        const savedState = sessionStorage.getItem('vk_auth_state')
        
        // Проверка CSRF-защиты
        if (!returnedState || returnedState !== savedState) {
          throw new Error('Ошибка безопасности: несовпадение проверочного токена state')
        }

        // Очищаем сессионную память
        sessionStorage.removeItem('vk_code_verifier')
        sessionStorage.removeItem('vk_auth_state')

        // Возвращаем пользователя на наш основной хэш-роут приложения, очищая URL от мусора
        window.history.replaceState({}, document.title, window.location.origin + '/#/auth')

        // Отправляем посылку бэкенду. Ссылка редиректа должна в точности совпадать с той, что была в кнопке!
        const REDIRECT_URI = window.location.origin + '/auth'
        await dispatch(fetchVkWebsiteAuth({ code, codeVerifier, redirectUri: REDIRECT_URI })).unwrap()
        
        message.success('Успешный вход через ВКонтакте!')
      } catch (error) {
        console.error('Ошибка OAuth 2.1 + PKCE + State:', error)
        message.error(error?.message || error || 'Не удалось подтвердить вход ВК')
        
        sessionStorage.removeItem('vk_code_verifier')
        sessionStorage.removeItem('vk_auth_state')
        window.history.replaceState({}, document.title, window.location.origin + '/#/auth')
      } finally {
        setIsProcessingVk(false)
      }
    }
  }

  parseVkAuthCode()
}, [dispatch])

  // Пока крутится отправка токена на бэкенд, форму не показываем — держим фоновый лоадер
  if (isProcessingVk) {
    return (
      <div className={styles.main}>
        <div
          style={{
            color: 'var(--color-primary)',
            fontWeight: 'bold',
          }}
        >
          Авторизация ВКонтакте, подождите...
        </div>
      </div>
    )
  }

  return <div className={styles.main}>{!isAuth && <AuthForm />}</div>
}

export default AuthPage
