import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

//Универсальный thunk для генерации ссылки на оплату ЮKassa
const fetchPaymentLink = createAsyncThunk(
  'payment/fetchPaymentLink',
  async ({ typeOrder, itemCode, isVk }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/pay/create-payment',
        {
          typeOrder,
          itemCode,
          isVk,
        },
      )
      // Теперь бэкенд должен возвращать помимо ссылки еще и orderId (idempotenceKey)
      // { success: true, confirmationUrl: "...", orderId: "..." }
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при формировании платежа',
      )
    }
  },
)

// Отправляет запрос на бэкенд для проверки статуса заказа в нашей БД
const fetchCheckOrderStatus = createAsyncThunk(
  'payment/fetchCheckOrderStatus',
  async (orderId, { rejectWithValue }) => {
    try {
      // Делаем гет-запрос на бэкенд (роут создадим на следующем шаге бэкенда при необходимости)
      const response = await axiosInstance.get(
        `/pay/order-status/${orderId}`,
      )
      // Ожидаем от бэкенда: { success: true, status: 'completed'|'created'|'failed', typeOrder, itemCode }
      return response.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка при проверке статуса платежа',
      )
    }
  },
)

const initialState = {
  confirmationUrl: null,
  currentOrderId: null, // Идентификатор текущего проверяемого заказа
  orderStatus: null, // 'created', 'completed', 'failed'
  loading: false,
  error: null,
}

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearPaymentState: (state) => {
      state.confirmationUrl = null
      state.currentOrderId = null
      state.orderStatus = null
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // --- FETCH PAYMENT LINK ---
      .addCase(fetchPaymentLink.pending, (state) => {
        state.loading = true
        state.error = null
        state.confirmationUrl = null
        state.currentOrderId = null
      })
      .addCase(fetchPaymentLink.fulfilled, (state, action) => {
        state.loading = false
        state.confirmationUrl = action.payload.confirmationUrl
        state.currentOrderId = action.payload.orderId // Запоминаем ID заказа для проверки
        state.orderStatus = 'created'
      })
      .addCase(fetchPaymentLink.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // --- CHECK ORDER STATUS ---
      .addCase(fetchCheckOrderStatus.pending, (state) => {
        // Здесь не ставим глобальный loading=true, чтобы не вешать интерфейс спиннером во время фоновой проверки
      })
      .addCase(fetchCheckOrderStatus.fulfilled, (state, action) => {
        state.orderStatus = action.payload.status // Обновляем статус ('completed', 'failed' и т.д.)
      })
      .addCase(fetchCheckOrderStatus.rejected, (state, action) => {
        state.error = action.payload
      })
  },
})

export const { clearPaymentState } = paymentSlice.actions
export { fetchCheckOrderStatus, fetchPaymentLink }
export default paymentSlice.reducer
