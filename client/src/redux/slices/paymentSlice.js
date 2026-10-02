import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

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
      return response.data.confirmationUrl // Возвращаем только чистую ссылку
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка формирования платежа',
      )
    }
  },
)

const paymentSlice = createSlice({
  name: 'payment',
  initialState: { loading: false, error: null },
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
  },
})

export const { clearPaymentState } = paymentSlice.actions
export { fetchPaymentLink }
export default paymentSlice.reducer
