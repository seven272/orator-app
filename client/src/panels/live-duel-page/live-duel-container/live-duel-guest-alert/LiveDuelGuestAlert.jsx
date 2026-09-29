import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { FiLock, FiUserPlus, FiArrowLeft } from 'react-icons/fi'
import { message } from 'antd'

import { useVkEnvironment } from '../../../../hooks/useVkEnvironment'
import {
  fetchVkRegister,
  checkIsVkGuest,
} from '../../../../redux/slices/authSlice'
import styles from './LiveDuelGuestAlert.module.css'

const LiveDuelGuestAlert = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isVkEnvironment } = useVkEnvironment()

  // Динамически определяем, является ли гость пользователем из экосистемы ВК
  const isVkGuest = useSelector(checkIsVkGuest)
 

  // Главное целевое действие компонента
  const handleActionClick = async () => {
    if (isVkEnvironment && isVkGuest) {
      //  Создание аккаунта в 1 клик прямо на месте
      const launchParams = window.location.search
      try {
        await dispatch(fetchVkRegister({ launchParams })).unwrap()
        message.success(
          'Аккаунт успешно создан! Добро пожаловать на баттлы.',
        )
      } catch (error) {
        message.error(error || 'Не удалось создать аккаунт')
      }
    } else {
      // Редирект на стандартную форму авторизации
      navigate('/auth')
    }
  }

  const handleGoBack = () => {
    navigate('/') // Возврат на главную страницу приложения
  }

  return (
    <div className={styles.alert_overlay}>
      <div className={styles.alert_card}>
        {/* Контрастная премиальная иконка замка с неоновым свечением */}
        <div
          className={`${styles.icon_ring} ${isVkGuest ? styles.glow_vk : styles.glow_site}`}
        >
          <FiLock className={styles.lock_icon} size={28} />
        </div>

        <h2 className={styles.alert_title}>Доступ ограничен</h2>

        <p className={styles.alert_description}>
          Живые голосовые баттлы доступны только зарегистрированным
          ораторам. Гостевой аккаунт не поддерживает запись и
          синхронизацию аудиореплик.
        </p>

        <p className={styles.alert_description_sub}>
          {isVkGuest
            ? 'Создайте полноценный Аккаунт Оратора в 1 клик, чтобы бросать вызовы сильнейшим оппонентам, копить монеты, прокачивать стрик активности и сохранять прогресс!'
            : 'Зарегистрируйтесь на сайте, чтобы открыть доступ к дуэлям, прокачивать харизму, собирать достижения и навсегда зафиксировать свой ораторский прогресс!'}
        </p>

        {/* Вертикальный стек премиальных кнопок */}
        <div className={styles.actions_stack}>
          <button
            type="button"
            className={`${styles.base_btn} ${isVkGuest ? styles.vk_btn : styles.site_btn}`}
            onClick={handleActionClick}
          >
            {isVkGuest ? (
              <>
                <FiUserPlus size={18} />
                <span>Создать аккаунт оратора</span>
              </>
            ) : (
              <>
                <FiUserPlus size={18} />
                <span> Войти / Зарегистрироваться</span>
              </>
            )}
          </button>

          <button
            type="button"
            className={`${styles.base_btn} ${styles.back_btn}`}
            onClick={handleGoBack}
          >
            <FiArrowLeft size={16} />
            <span>Вернуться на главную</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LiveDuelGuestAlert
