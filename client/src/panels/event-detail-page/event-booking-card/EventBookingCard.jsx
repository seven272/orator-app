import React from 'react'
import { TbTicket, TbUserPlus } from 'react-icons/tb'

import styles from './EventBookingCard.module.css'

const EventBookingCard = ({
  priceRub,
  isAuth,
  isRegistered,
  isPast,
  isSoldOut,
  isSubmitting,
  onNavigateAuth,
  onRegisterOrPay,
}) => {
  if (isRegistered) {
    return null
  }

  return (
    <section className={styles.booking_card}>
      <div className={styles.booking_price_row}>
        <span className={styles.booking_label}>Стоимость участия</span>
        <span className={styles.booking_price}>
          {priceRub === 0 ? 'Бесплатно' : `${priceRub} ₽`}
        </span>
      </div>

      {isPast ? (
        <button type="button" className={styles.disabled_action_btn} disabled>
          <span>Мероприятие уже завершилось</span>
        </button>
      ) : !isAuth ? (
        <button
          type="button"
          className={styles.primary_action_btn}
          onClick={onNavigateAuth}
        >
          <TbUserPlus size={18} />
          <span>Войти для записи на мероприятие</span>
        </button>
      ) : isSoldOut ? (
        <button type="button" className={styles.disabled_action_btn} disabled>
          <span>К сожалению, все места заняты</span>
        </button>
      ) : (
        <button
          type="button"
          className={styles.primary_action_btn}
          onClick={onRegisterOrPay}
          disabled={isSubmitting}
        >
          <TbTicket size={18} />
          <span>
            {isSubmitting
              ? 'Оформляем...'
              : priceRub === 0
              ? 'Записаться бесплатно'
              : `Оплатить участие · ${priceRub} ₽`}
          </span>
        </button>
      )}

      {priceRub > 0 && isAuth && !isSoldOut && !isPast && (
        <p className={styles.payment_hint}>
          Оплата через ЮKassa. После подтверждения платежа место закрепится за
          вами, а адрес или ссылка на встречу откроются на этой странице.
        </p>
      )}
    </section>
  )
}

export default EventBookingCard
