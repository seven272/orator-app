// merch-management/MerchManagement.jsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { fetchToggleOrderShipped } from '../../../redux/slices/adminSlice'
import styles from './MerchManagement.module.css'

const MerchManagement = () => {
  const dispatch = useDispatch()
  const { merch_orders } = useSelector((state) => state.admin)

  const item_names_map = {
    merch_orator_badge: '🏅 Значок «Орден Златоуста»',
    merch_diploma_frame: '📜 Диплом «Мастер Речи»',
  }

  const handleToggleStatus = (order_id) => {
    dispatch(fetchToggleOrderShipped(order_id))
  }

  return (
    <div className={styles.merch_wrapper}>
      <div className={styles.merch_section}>
        <h2 className={styles.section_title}>
          Управление заказами мерча
        </h2>

        {!merch_orders || merch_orders.length === 0 ? (
          <div className={styles.empty_message}>Заказов пока нет</div>
        ) : (
          merch_orders.map((order) => (
            <div
              key={order.order_id}
              className={`${styles.order_item} ${order.is_shipped ? styles.order_done : ''}`}
            >
              <div className={styles.order_main_info}>
                <span className={styles.item_title}>
                  {item_names_map[order.item_code] || order.item_code}
                </span>

                {/* ВЫВОД ДАННЫХ CRM: ИД, Покупатель, Адрес */}
                <span className={styles.meta_text}>
                  ID пользователя:{' '}
                  <strong className={styles.selectable_id}>
                    {order.user_id}
                  </strong>
                </span>
                <span className={styles.meta_text}>
                  Покупатель: <strong>{order.user_name}</strong> (
                  {order.user_email})
                </span>

                <div className={styles.address_box}>
                  <strong>📍 Адрес доставки:</strong>
                  <p className={styles.address_paragraph}>
                    {order.delivery_address}
                  </p>
                </div>
              </div>

              {/* Интерактивная кнопка обработки заказа */}
              <button
                className={`${styles.status_btn} ${order.is_shipped ? styles.status_shipped : styles.status_pending}`}
                onClick={() => handleToggleStatus(order.order_id)}
              >
                {order.is_shipped ? '✓ Доставлено' : '⏳ В обработке'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MerchManagement
