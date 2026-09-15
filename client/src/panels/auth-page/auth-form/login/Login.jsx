/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd' // Только для алертов уведомлений
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa' // Чистые Fa-иконки
import { FaVk } from 'react-icons/fa' // Импортируем официальное векторное лого ВК
import bridge from '@vkontakte/vk-bridge'
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

  //   const handleVkLoginClick = async () => {
  //   try {
  //     if (bridge.isEmbedded()) {
  //       await bridge.send('VKWebAppInit')
  //       const vkData = await bridge.send('VKWebAppGetUserInfo')
  //       alert(`Привет, ${vkData.first_name}!`)
  //       return
  //     }

  //     const VK_APP_ID = '54772667'
  //     // ⚠️ Без хеша — чистый путь
  //     const REDIRECT_URI = window.location.origin + '/auth'

  //     const verifier = generateCodeVerifier()
  //     const challenge = await generateCodeChallenge(verifier)

  //     const array = new Uint32Array(8)
  //     window.crypto.getRandomValues(array)
  //     const state = Array.from(array, (dec) => dec.toString(16)).join('')

  //     // ⚠️ sessionStorage вместо localStorage
  //     sessionStorage.setItem('vk_code_verifier', verifier)
  //     sessionStorage.setItem('vk_auth_state', state)

  //     const params = new URLSearchParams({
  //       response_type: 'code',
  //       client_id: VK_APP_ID,
  //       redirect_uri: REDIRECT_URI,
  //       scope: 'email phone',
  //       state,
  //       code_challenge: challenge,
  //       code_challenge_method: 'S256',
  //     })

  //     window.location.href =
  //       `https://id.vk.ru/authorize?${params.toString().replaceAll('+', '%20')}`
  //   } catch (err) {
  //     console.error('Ошибка VK Auth:', err)
  //     message.error('Не удалось связаться с ВКонтакте')
  //   }
  // }
  // useEffect(() => {
  //   const CLIENT_ID =
  //     Number(import.meta.env.VITE_VK_AUTH_APP_ID) || 54772667
  //   const REDIRECT_URI = `${window.location.origin}/auth`

  //   // 1. Инициализируем глобальный конфиг через импортированный модуль пакета
  //   VKID.Config.set({
  //     app: CLIENT_ID,
  //     redirectUrl: REDIRECT_URI,
  //     // responseMode: Callback сообщает SDK, что мы хотим перехватить код прямо в JS-сессии,
  //     // это отключает конфликты жесткого редиректа страниц
  //     responseMode: VKID.ConfigResponseMode.Callback,
  //     state: Math.random().toString(16).substring(2),
  //   })

  //   // 2. Создаем инстанс списка провайдеров OAuthList
  //   const oAuthList = new VKID.OAuthList()

  //   if (vkContainerRef.current) {
  //     // Очищаем контейнер перед рендером для предотвращения дублирования при горячей перезагрузке (HMR)
  //     vkContainerRef.current.innerHTML = ''

  //     oAuthList
  //       .render({
  //         container: vkContainerRef.current,
  //         styles: {
  //           borderRadius: 8,
  //           height: 44,
  //         },
  //         // Передаем точные строковые ключи для карты иконок
  //         oauthList: ['vkid', 'mail_ru', 'ok_ru'],
  //       })
  //       .on(VKID.WidgetEvents.ERROR, (error) => {
  //         console.error('Ошибка виджета VK ID SDK:', error)
  //         message.error(
  //           'Не удалось загрузить виджет авторизации соцсетей',
  //         )
  //       })
  //       // Перехватываем успешную авторизацию (для любой из трех выбранных соцсетей!)
  //       .on(
  //         VKID.OAuthListInternalEvents.LOGIN_SUCCESS,
  //         async (payload) => {
  //           const { code, device_id } = payload

  //           // Автоматически запрашиваем code_verifier из внутреннего стейта самого SDK
  //           const codeVerifier = VKID.Auth.getCodeVerifier?.() || ''

  //           setLoading(true)
  //           try {
  //             // Безопасно отправляем code, deviceId и верификатор на бэкенд
  //             await dispatch(
  //               fetchVkWebsiteAuth({
  //                 code,
  //                 deviceId: device_id,
  //                 codeVerifier,
  //                 redirectUri: REDIRECT_URI,
  //               }),
  //             ).unwrap()

  //             message.success('Успешный вход в систему!')
  //           } catch (err) {
  //             message.error(
  //               err || 'Не удалось подтвердить вход в аккаунт',
  //             )
  //           } finally {
  //             setLoading(false)
  //           }
  //         },
  //       )
  //   }
  // }, [dispatch])

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
              message.error(
                'Не удалось загрузить виджет авторизации ВКонтакте',
              )
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

          {/* <button
            type="button"
            className={styles.vk_premium_btn}
            onClick={handleVkLoginClick}
          >
            <div className={styles.vk_glow_effect}></div>
            <FaVk className={styles.vk_vector_icon} />
            <span className={styles.vk_btn_text}>
              Войти через ВКонтакте
            </span>
          </button> */}

          <div
            ref={vkContainerRef}
            className={styles.vk_buttons_container}
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
