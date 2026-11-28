import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { DEFAULT_PAYMENT_RULES } from '../../utils/paymentPolicy'

const fetchPaymentLink = createAsyncThunk(
  'payment/fetchPaymentLink',
  async ({ typeOrder, itemCode, isVk }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/pay/create-payment', {
        typeOrder,
        itemCode,
        isVk,
      })
      return response.data.confirmationUrl // Возвращаем только чистую ссылку
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка формирования платежа',
      )
    }
  },
)

// Загрузка актуальных правил приёма платежей по платформам
const fetchGetPaymentPolicy = createAsyncThunk(
  'payment/fetchGetPaymentPolicy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/payment-policy')
      return response.data.paymentRules
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось загрузить правила оплаты',
      )
    }
  },
)

// [ADMIN] Обновление правил приёма платежей по платформам
const fetchUpdatePaymentPolicy = createAsyncThunk(
  'payment/fetchUpdatePaymentPolicy',
  async (paymentRules, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put('/payment-policy/update-rules', {
        paymentRules,
      })
      return response.data.paymentRules
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Не удалось сохранить правила оплаты',
      )
    }
  },
)

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    loading: false,
    error: null,
    paymentRules: DEFAULT_PAYMENT_RULES,
    isPolicyLoaded: false,
    isUpdatingPolicy: false,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentLink.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchPaymentLink.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(fetchPaymentLink.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Загрузка правил оплаты
      .addCase(fetchGetPaymentPolicy.fulfilled, (state, action) => {
        if (action.payload) {
          state.paymentRules = action.payload
        }
        state.isPolicyLoaded = true
      })
      .addCase(fetchGetPaymentPolicy.rejected, (state) => {
        // При ошибке сети оставляем дефолтные правила, но отмечаем завершение попытки
        state.isPolicyLoaded = true
      })

      // Обновление правил оплаты из админки
      .addCase(fetchUpdatePaymentPolicy.pending, (state) => {
        state.isUpdatingPolicy = true
      })
      .addCase(fetchUpdatePaymentPolicy.fulfilled, (state, action) => {
        state.isUpdatingPolicy = false
        if (action.payload) {
          state.paymentRules = action.payload
        }
      })
      .addCase(fetchUpdatePaymentPolicy.rejected, (state) => {
        state.isUpdatingPolicy = false
      })
  },
})

export const { clearPaymentState } = paymentSlice.actions
export {
  fetchPaymentLink,
  fetchGetPaymentPolicy,
  fetchUpdatePaymentPolicy,
}
export default paymentSlice.reducer
