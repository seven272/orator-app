import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { message } from 'antd'
import {
  fetchCheckOrderStatus,
  clearPaymentState,
} from '../redux/slices/paymentSlice'

/**
 * Универсальный хук для фонового поллинга статуса заказа
 * @param {boolean} isOpenModal - открыто ли модальное окно
 * @param {string} targetItemCode - код товара ('premium_30d', 'sales_master' и т.д.)
 * @param {function} onSuccess - колбэк, вызываемый при успешной оплате
 */
export const usePaymentPolling = (
  isOpenModal,
  targetItemCode,
  onSuccess,
) => {
  const dispatch = useDispatch()
  const pollingIntervalRef = useRef(null)
  const { currentOrderId, orderStatus } = useSelector(
    (state) => state.payment,
  )

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  useEffect(() => {
    if (
      currentOrderId &&
      !pollingIntervalRef.current &&
      orderStatus === 'created' &&
      isOpenModal
    ) {
      console.log(
        `[POLLING] Фоновое отслеживание заказа: ${currentOrderId} (${targetItemCode})`,
      )

      pollingIntervalRef.current = setInterval(async () => {
        try {
          const result = await dispatch(
            fetchCheckOrderStatus(currentOrderId),
          ).unwrap()

          // Проверяем, что бэкенд вернул статус completed И код товара совпадает с текущим
          if (result.itemCode === targetItemCode) {
            if (result.status === 'completed') {
              stopPolling()
              dispatch(clearPaymentState())
              onSuccess()
            } else if (result.status === 'failed') {
              stopPolling()
              message.error('Платеж был отклонен шлюзом ЮKassa')
              dispatch(clearPaymentState())
            }
          }
        } catch (err) {
          console.error('Ошибка поллинга статуса платежа:', err)
        }
      }, 3000)
    }

    return () => stopPolling()
  }, [
    currentOrderId,
    orderStatus,
    isOpenModal,
    targetItemCode,
    dispatch,
    onSuccess,
  ])

  return { stopPolling }
}
