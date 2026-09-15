/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd' // Только для алертов уведомлений
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa' // Чистые Fa-иконки
import * as VKID from '@vkid/sdk'

import {
  fetchLoginUser,
  fetchVkWebsiteAuth,
} from '../../../../redux/slices/authSlice'
import {
  generateCodeChallenge,
  generateCodeVerifier,
} from '../../../../utils/pkce'
import styles from './Login.module.css'

const Login = ({ showRegister }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const vkContainerRef = useRef(null) // Реф для контейнера списка соцсетей ВК

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [emailError, setEmailError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const validateEmailFormat = (val) => {
    const cleanEmail = val.trim()
    if (!cleanEmail) {
      setEmailError('Введите email')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      setEmailError('Некорректный формат email')
      return false
    }
    setEmailError('')
    return true
  }

  const handleSubmit = async (evt) => {
    evt.preventDefault()

    const isEmailValid = validateEmailFormat(email)
    if (!isEmailValid) return

    if (!password) {
      message.error('Введите пароль!')
      return
    }

    setLoading(true)
    try {
      await dispatch(
        fetchLoginUser({ email: email.trim(), password }),
      ).unwrap()
      message.success('Вы успешно авторизовались!')
    } catch (error) {
      message.error(error || 'Ошибка при авторизации')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initializeVkSdk = async () => {
      const CLIENT_ID =
        Number(import.meta.env.VITE_VK_AUTH_APP_ID) || 54772667
      const REDIRECT_URI = `${window.location.origin}/auth`

      // 1. Генерируем PKCE на фронте
      const verifier = generateCodeVerifier()
      const challenge = await generateCodeChallenge(verifier) // SHA256 → base64url

      // 2. Криптостойкий state
      const stateArray = new Uint32Array(8)
      window.crypto.getRandomValues(stateArray)
      const state = Array.from(stateArray, (dec) =>
        dec.toString(16),
      ).join('')

      // 3. Сохраняем verifier — отправим на бэкенд после авторизации
      sessionStorage.setItem('vk_code_verifier', verifier)
      sessionStorage.setItem('vk_auth_state', state)

      // 4. Config.init (НЕ set), передаём codeChallenge (НЕ codeVerifier)
      VKID.Config.init({
        app: CLIENT_ID,
        redirectUrl: REDIRECT_URI,
        responseMode: VKID.ConfigResponseMode.Callback,
        state,
        codeChallenge: challenge,
        scope: 'email',
      })

      // 5. Рендер виджета
      const oneTapButton = new VKID.OneTap()

      if (vkContainerRef.current) {
        vkContainerRef.current.innerHTML = ''

        // 🔥 ИСПРАВЛЕНИЕ: Даем React завершить отрисовку DOM, прежде чем VK ID начнет внедрять свои iframe-хуки
        setTimeout(() => {
          // Проверяем, что контейнер все еще существует на экране (пользователь не ушел на другую страницу)
          if (!vkContainerRef.current) return

          oneTapButton
            .render({
              container: vkContainerRef.current,
              styles: {
                borderRadius: 8,
                height: 44,
              },
              // 📌 Выключаем альтернативные способы входа, оставляя строго ВК!
              showAlternativeLoginMethods: false,
            })
            .on(VKID.WidgetEvents.ERROR, (error) => {
              console.error('Ошибка виджета VK ID One Tap:', error)
            })
            .on(
              VKID.OAuthListInternalEvents.LOGIN_SUCCESS,
              async (payload) => {
                const {
                  code,
                  device_id,
                  state: returnedState,
                } = payload

                const savedState =
                  sessionStorage.getItem('vk_auth_state')
                if (returnedState !== savedState) {
                  message.error(
                    'Ошибка безопасности: state не совпадает',
                  )
                  return
                }

                const codeVerifier = sessionStorage.getItem(
                  'vk_code_verifier',
                )
                if (!codeVerifier) {
                  message.error(
                    'Утрачен код верификации, попробуйте снова',
                  )
                  return
                }

                setLoading(true)
                try {
                  await dispatch(
                    fetchVkWebsiteAuth({
                      code,
                      deviceId: device_id,
                      codeVerifier,
                      state: returnedState,
                      redirectUri: REDIRECT_URI,
                    }),
                  ).unwrap()

                  sessionStorage.removeItem('vk_code_verifier')
                  sessionStorage.removeItem('vk_auth_state')
                  message.success('Успешный вход в систему!')
                  navigate('/profile', { replace: true })
                } catch (err) {
                  message.error(
                    err || 'Не удалось подтвердить вход в аккаунт',
                  )
                } finally {
                  setLoading(false)
                }
              },
            )
        }, 50) // Микро-задержка в 50мс полностью разгружает цикл рендеринга
      }
    }
    initializeVkSdk()
  }, [dispatch])

  return (
    <div className="page_form">
      <h3 className={styles.heading}>Авторизоваться</h3>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 370, width: '100%' }}
      >
        {/* Поле Email */}
        <div className={styles.input_group}>
          <div
            className={`${styles.input_wrapper} ${emailError ? styles.input_invalid : ''}`}
          >
            <FaEnvelope className={styles.input_icon} />
            <input
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => validateEmailFormat(e.target.value)}
              className={styles.native_input}
            />
          </div>
          {emailError && (
            <span className={styles.error_text}>{emailError}</span>
          )}
        </div>

        {/* Поле Пароля */}
        <div className={styles.input_group}>
          <div className={styles.input_wrapper}>
            <FaLock className={styles.input_icon} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.native_input}
            />
            <button
              type="button"
              className={styles.eye_btn}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className={styles.action_flex}>
          <button
            type="submit"
            className={styles.btn}
            disabled={loading}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <div className={styles.divider}>
            <span className={styles.divider_text}>или</span>
          </div>
          <div
            ref={vkContainerRef}
            className={styles.vk_button_container}
          ></div>

          <div className={styles.divider}>
            <span className={styles.divider_text}>или</span>
          </div>

          <a
            onClick={() => showRegister('register')}
            className={styles.link}
          >
            регистрация!
          </a>
        </div>
      </form>
    </div>
  )
}

export default Login
