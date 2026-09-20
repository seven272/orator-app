import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { FaRocket } from 'react-icons/fa' // Импорт стильной ракеты
import { closeGuestOffer } from '../../../redux/slices/exerciseSlice'
import {
  fetchVkRegister,
  checkIsVkGuest,
} from '../../../redux/slices/authSlice'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import styles from './EnergyGuestAlert.module.css'

const EnergyGuestAlert = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const isGuestOfferOpen = useSelector(
    (state) => state.exercise.isGuestOfferOpen,
  )
  const isVkGuest = useSelector(checkIsVkGuest)

  // 🔒 Блокировка скролла страницы при открытом окне
  useEffect(() => {
    if (isGuestOfferOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isGuestOfferOpen])

  if (!isGuestOfferOpen) return null

  // Обработчик клика по главной кнопке-капсуле
  const handleActionClick = async () => {
    dispatch(closeGuestOffer())

    if (isVkGuest) {
      // 🎁 Контекст ВК: Ленивая регистрация на месте
      const launchParams = window.location.search
      try {
        await dispatch(fetchVkRegister({ launchParams })).unwrap()
        message.success(
          'Аккаунт успешно создан! Доступно 15 единиц энергии.',
        )
      } catch (error) {
        message.error(error || 'Не удалось создать аккаунт')
      }
    } else {
      // 🔑 Контекст Сайта: Редирект на обычную авторизацию
      navigate('/auth')
    }
  }

  const handleGoToBack = () => {
    dispatch(closeGuestOffer())
    navigate('/exercises-all')
  }
  
  const handleClickOverlay = () => {
    dispatch(closeGuestOffer())
    navigate('/exercises-all')
  }
  return (
    <div
      className={styles.modal_overlay}
      onClick={handleClickOverlay}
    >
      <div
        className={styles.modal_content}
        onClick={(evt) => evt.stopPropagation()}
      >
        {/* Ореол сияния вокруг ракеты */}
        <div className={styles.icon_glow_ring}>
          <FaRocket className={styles.rocket_icon} />
        </div>

        <h2 className={styles.modal_title}>Лимит энергии исчерпан</h2>

        <p className={styles.modal_description}>
          Вы полностью израсходовали суточный лимит гостевой энергии (
          <span
            className={
              isVkGuest ? styles.highlight_vk : styles.highlight_blue
            }
          >
            3 единицы
          </span>
          ).
        </p>

        <p className={styles.modal_description}>
          {isVkGuest
            ? 'Создайте аккаунт в 1 клик, чтобы мгновенно расширить бак до 15 единиц энергии, открыть личный инвентарь и сохранить весь свой ораторский прогресс!'
            : 'Зарегистрируйтесь на сайте, чтобы мгновенно получить 15 единиц энергии, открыть личный инвентарь и навсегда сохранить свой ораторский прогресс!'}
        </p>

        {/* Стек динамических премиальных кнопок */}
        <div className={styles.actions_stack}>
          <button
            type="button"
            className={`${styles.base_btn} ${isVkGuest ? styles.vk_action_btn : styles.site_action_btn}`}
            onClick={handleActionClick}
          >
            {isVkGuest
              ? '🎁 Создать аккаунт'
              : '🔑 Войти / Зарегистрироваться'}
          </button>

          <button
            type="button"
            className={`${styles.base_btn} ${styles.cancel_text_btn}`}
            onClick={handleGoToBack}
          >
            Позже
          </button>
        </div>
      </div>
    </div>
  )
}

export default EnergyGuestAlert
