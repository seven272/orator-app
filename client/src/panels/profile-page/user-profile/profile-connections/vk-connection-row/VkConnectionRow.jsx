/* eslint-disable react/prop-types */
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { message } from 'antd'
import { FaVk } from 'react-icons/fa6'
import { MdCheckCircle } from 'react-icons/md'
import * as VKID from '@vkid/sdk' // Используем официальный SDK

import { fetchLinkVk } from '../../../../../redux/slices/authSlice'
import { generateCodeChallenge, generateCodeVerifier } from '../../../../../utils/pkce'
import styles from './VkConnectionRow.module.css'

const VkConnectionRow = ({ user, isLoading: authLoading }) => {
  const dispatch = useDispatch()
  const vkContainerRef = useRef(null) // Реф для внедрения iframe-кнопки VK One Tap
  const [localLoading, setLocalLoading] = useState(false)

  useEffect(() => {
    // Если у пользователя уже привязан vkId, виджет инициализировать не нужно
    if (user?.vkId) return

    const initializeVkLinkWidget = async () => {
      const CLIENT_ID = Number(import.meta.env.VITE_VK_AUTH_APP_ID) || 54772667
      const REDIRECT_URI = `${window.location.origin}/auth` // Тот же URI для валидации на бэкенде

      try {
        // ── 1. ГЕНЕРАЦИЯ КРИПТОГРАФИИ PKCE ──
        const verifier = generateCodeVerifier()
        const challenge = await generateCodeChallenge(verifier)

        // ── 2. ГЕНЕРАЦИЯ STATE ДЛЯ ЗАЩИТЫ ОТ CSRF ──
        const stateArray = new Uint32Array(8)
        window.crypto.getRandomValues(stateArray)
        const state = Array.from(stateArray, (dec) => dec.toString(16)).join('')

        // Сохраняем ключи в sessionStorage специально для процесса линковки
        sessionStorage.setItem('vk_link_verifier', verifier)
        sessionStorage.setItem('vk_link_state', state)

        // ── 3. ИНИЦИАЛИЗАЦИЯ CONFIG SDK ──
        VKID.Config.init({
          app: CLIENT_ID,
          redirectUrl: REDIRECT_URI,
          responseMode: VKID.ConfigResponseMode.Callback,
          state,
          codeChallenge: challenge,
          scope: 'email',
        })

        // ── 4. СОЗДАНИЕ И РЕНДЕР КНОПКИ ONE TAP ──
        const oneTapButton = new VKID.OneTap()

        if (vkContainerRef.current) {
          vkContainerRef.current.innerHTML = '' // Очищаем контейнер перед рендером

          // Микро-задержка для безопасной отрисовки DOM в React
          setTimeout(() => {
            if (!vkContainerRef.current) return

            oneTapButton
              .render({
                container: vkContainerRef.current,
                styles: {
                  borderRadius: 8,
                  height: 38, // Аккуратная высота под дизайн-код профиля
                },
                showAlternativeLoginMethods: false, // Отключаем лишние кнопки входа
              })
              .on(VKID.WidgetEvents.ERROR, (error) => {
                console.error('Ошибка виджета VK ID при привязке:', error)
              })
              .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload) => {
                const { code, device_id, state: returnedState } = payload

                // Валидация крипто-подписи state
                const savedState = sessionStorage.getItem('vk_link_state')
                if (returnedState !== savedState) {
                  message.error('Ошибка безопасности: state сессии не совпадает!')
                  return
                }

                // Извлекаем сохраненный code_verifier
                const codeVerifier = sessionStorage.getItem('vk_link_verifier')
                if (!codeVerifier) {
                  message.error('Утрачен код верификации сессии, попробуйте снова')
                  return
                }

                setLocalLoading(true)
                try {
                  // Отправляем защищенный пакет PKCE в Thunk привязки аккаунта
                  await dispatch(
                    fetchLinkVk({
                      code,
                      deviceId: device_id,
                      codeVerifier,
                      state: returnedState,
                      redirectUri: REDIRECT_URI,
                    })
                  ).unwrap()

                  // Зачищаем временные ключи при успехе
                  sessionStorage.removeItem('vk_link_verifier')
                  sessionStorage.removeItem('vk_link_state')
                  message.success('Аккаунт ВКонтакте успешно привязан!')
                } catch (err) {
                  // Если бэкенд вернет 409 (VK_ALREADY_TAKEN), экстра-редюсер в слайсе 
                  // сам запишет конфликт в state.mergeConflict, что откроет модалку слияния.
                  // Текст ошибки для обычных сбоев выводим здесь:
                  if (!err?.code) {
                    message.error(err?.message || 'Не удалось привязать ВКонтакте')
                  }
                } finally {
                  setLocalLoading(false)
                }
              })
          }, 50)
        }
      } catch (err) {
        console.error('Ошибка инициализации VK ID SDK в профиле:', err)
      }
    }

    initializeVkLinkWidget()
  }, [dispatch, user?.vkId])

  const isGlobalLoading = authLoading || localLoading

  return (
    <div className={styles.link_row}>
      <span className={styles.row_text_label}>
        <FaVk className={`${styles.row_icon} ${styles.vk_color_icon}`} />
        Привязать профиль ВК
      </span>

      {user?.vkId ? (
        /* Если VK уже привязан — рендерим красивый синий бейдж */
        <span className={styles.status_connected_badge}>
          <MdCheckCircle /> Подключено
        </span>
      ) : (
        /* Если VK не привязан — VK ID SDK автоматически отрендерит сюда кнопку One Tap */
        <div 
          ref={vkContainerRef} 
          className={`${styles.vk_widget_bind_container} ${isGlobalLoading ? styles.widget_disabled : ''}`}
        ></div>
      )}
    </div>
  )
}

export default VkConnectionRow
