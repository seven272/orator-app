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
      console.log(
        `%c[POLLING] 🛑 Таймер остановлен и очищен для заказа: ${currentOrderId}`,
        'color: #dc3545; font-weight: bold;',
      )
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }

  // useEffect(() => {
  //   if (
  //     currentOrderId &&
  //     !pollingIntervalRef.current &&
  //     orderStatus === 'created' &&
  //     isOpenModal
  //   ) {
  //     console.log(
  //       `[POLLING] Фоновое отслеживание заказа: ${currentOrderId} (${targetItemCode})`,
  //     )

  //     pollingIntervalRef.current = setInterval(async () => {
  //       try {
  //         const result = await dispatch(
  //           fetchCheckOrderStatus(currentOrderId),
  //         ).unwrap()

  //         // Проверяем, что бэкенд вернул статус completed И код товара совпадает с текущим
  //         if (result.itemCode === targetItemCode) {
  //           if (result.status === 'completed') {
  //             stopPolling()
  //             dispatch(clearPaymentState())
  //             onSuccess()
  //           } else if (result.status === 'failed') {
  //             stopPolling()
  //             message.error('Платеж был отклонен шлюзом ЮKassa')
  //             dispatch(clearPaymentState())
  //           }
  //         }
  //       } catch (err) {
  //         console.error('Ошибка поллинга статуса платежа:', err)
  //       }
  //     }, 3000)
  //   }

  //   return () => stopPolling()
  // }, [
  //   currentOrderId,
  //   orderStatus,
  //   isOpenModal,
  //   targetItemCode,
  //   dispatch,
  //   onSuccess,
  // ])

  useEffect(() => {
    // Логируем текущее состояние зависимостей при каждом их изменении
    console.log(`[POLLING TRIGGER CHECK] Окно активно: ${isOpenModal}, OrderID: ${currentOrderId}, Статус в Redux: ${orderStatus}`)

    if (currentOrderId && !pollingIntervalRef.current && orderStatus === 'created' && isOpenModal) {
      console.log(`%c[POLLING] 🚀 ЗАПУСК ТАЙМЕРА! Каждые 3 секунды опрашиваем бэкенд для: ${targetItemCode}`, 'color: #28a745; font-weight: bold;')
      
      pollingIntervalRef.current = setInterval(async () => {
        console.log(`[POLLING TICK] Отправляем GET-запрос проверки статуса для ордера ${currentOrderId}...`)
        
        try {
          // Важно: добавляем соль против кэша ?_t=..., чтобы избежать статуса 304!
          const result = await dispatch(fetchCheckOrderStatus(currentOrderId)).unwrap()
          
          console.log(`[POLLING RESPONSE] Бэкенд ответил для товара (${result.itemCode}): статус в БД равен -> "${result.status}"`)

          if (result.itemCode === targetItemCode) {
            if (result.status === 'completed') {
              console.log('%c[POLLING SUCCESS] 🎉 Деньги зашли! Вызываем onSuccess колбэк.', 'color: #28a745; font-weight: bold;')
              stopPolling()
              dispatch(clearPaymentState())
              if (onSuccess) onSuccess()
            } else if (result.status === 'failed') {
              console.error('[POLLING FAILED] ❌ ЮKassa отклонила платеж.')
              stopPolling()
              dispatch(clearPaymentState())
            }
          }
        } catch (err) {
          console.error('[POLLING ERROR] Ошибка выполнения запроса проверки:', err)
        }
      }, 3000)
    }

    return () => stopPolling()
  }, [currentOrderId, orderStatus, isOpenModal, targetItemCode, dispatch, onSuccess])

  return { stopPolling }
}
