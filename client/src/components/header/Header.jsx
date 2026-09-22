import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { message, Tooltip } from 'antd'
import { TbUserPlus } from 'react-icons/tb'

import styles from './Header.module.css'
import DropdownMenu from '../dropdown-menu/DropdownMenu'
import AvatarOrPlaceholder from '../avatar-or-placeholder/AvatarOrPlaceholder'
import GamePanelWidget from './game-panel-widget/GamePanelWidget' // Импорт нового супер-виджета

import {
  checkIsAuth,
  checkIsVkGuest,
  fetchVkRegister,
} from '../../redux/slices/authSlice'
import { syncGuestEnergy } from '../../redux/slices/profileSlice'
import {
  getGuestEnergy,
  setGuestEnergy,
} from '../../utils/vk-utils/vkStorageEnergy'
import logoImg from '../../assets/images/design/logo.png'

const Header = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Извлечение глобального стейта пользователей
  const { user: profileUser } = useSelector((state) => state.profile)
  const { user: authUser } = useSelector((state) => state.auth)

  const isAuth = useSelector(checkIsAuth)
  const isVkGuest = useSelector(checkIsVkGuest)
  const [siteGuestEnergy, setSiteGuestEnergy] = useState(3)

  // Контроль и ленивый сброс лимитов гостя сайта [INDEX]
  useEffect(() => {
    if (isAuth) return

    const initializeGuestEnergy = async () => {
      const todayStr = new Date().toISOString().split('T')[0] // Формат YYYY-MM-DD
      const savedDate = localStorage.getItem('govorix_guest_date')

      if (isVkGuest) {
        // 🌐 СЦЕНАРИЙ ГОСТЯ ВК: Синхронизируем через облако ВКонтакте [INDEX]
        if (!savedDate || savedDate !== todayStr) {
          localStorage.setItem('govorix_guest_date', todayStr)
          await setGuestEnergy(3) // Обнуляем в облаке ВК [INDEX]
          setSiteGuestEnergy(3)
          dispatch(syncGuestEnergy(3))
        } else {
          const currentVkEnergy = await getGuestEnergy() // Читаем из облака ВК [INDEX]
          setSiteGuestEnergy(currentVkEnergy)
          dispatch(syncGuestEnergy(currentVkEnergy))
        }
      } else {
        // 💻 СЦЕНАРИЙ ГОСТЯ САЙТА: Работаем через классический localStorage
        const savedEnergy = localStorage.getItem(
          'govorix_guest_energy',
        )
        if (!savedDate || savedDate !== todayStr) {
          localStorage.setItem('govorix_guest_date', todayStr)
          localStorage.setItem('govorix_guest_energy', '3')
          setSiteGuestEnergy(3)
          dispatch(syncGuestEnergy(3))
        } else {
          const currentEnergy =
            savedEnergy !== null ? parseInt(savedEnergy, 10) : 3
          setSiteGuestEnergy(currentEnergy)
          dispatch(syncGuestEnergy(currentEnergy))
        }
      }
    }

    initializeGuestEnergy()
  }, [isAuth, isVkGuest, dispatch])

  // Быстрая регистрация из ВК Mini Apps [INDEX]
  const handleFastVkRegister = async () => {
    const launchParams = window.location.search
    try {
      await dispatch(fetchVkRegister({ launchParams })).unwrap()
      message.success('Аккаунт успешно создан!')
    } catch (error) {
      message.error(error || 'Не удалось создать аккаунт')
    }
  }

  return (
    <div className={styles.header_global_wrap}>
      <div className={styles.header}>
        <div className={styles.header_wrapper}>
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

          <div className={styles.right_block}>
            {/* Пробрасываем накопленные пропсы в супер-виджет [INDEX] */}
            <GamePanelWidget
              isAuth={isAuth}
              isVkGuest={isVkGuest}
              profileUser={profileUser}
              siteGuestEnergy={siteGuestEnergy}
            />

            {isVkGuest ? (
              <Tooltip
                title="Нажмите, чтобы создать аккаунт оратора и забрать 15 ⚡ энергии!"
                placement="bottom"
                color="var(--color-primary)"
                styles={{
                  container: {
                    fontFamily: 'var(--font-family-regular)',
                    fontSize: '11px',
                  },
                }}
              >
                <button
                  type="button"
                  className={styles.vk_register_btn}
                  onClick={handleFastVkRegister}
                >
                  <span className={styles.vk_btn_icon}>
                    <TbUserPlus size={18} />
                  </span>
                  <span className={styles.vk_gift_badge}>🎁</span>
                </button>
              </Tooltip>
            ) : (
              <AvatarOrPlaceholder
                user={isAuth ? authUser : null}
                sizeClass="size_s"
                onClick={() =>
                  navigate(isAuth ? '/profile' : '/auth')
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header
