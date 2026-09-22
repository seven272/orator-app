import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

const fetchShopItems = createAsyncThunk(
  'shop/fetchShopItems',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/shop/get-all-items')
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Ошибка загрузки магазина',
      )
    }
  },
)

const fetchPurchaseItem = createAsyncThunk(
  'shop/fetchPurchaseItem',
  async ({ itemCode, deliveryAddress }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/shop/buy-item', {
        itemCode,
        deliveryAddress,
      })
      // Возвращает { message: "...", coins: 450, inventory: [...] }
      return res.data
    } catch (err) {
      return rejectWithValue(
        err.response?.data || 'Ошибка при совершении покупки',
      )
    }
  },
)

const shopSlice = createSlice({
  name: 'shop',
  initialState: {
    items: [],
    status: 'idle',
    purchaseStatus: 'idle',
    error: null,
  },
  reducers: {
    resetShopStatus: (state) => {
      state.purchaseStatus = 'idle'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Загрузка товаров
      .addCase(fetchShopItems.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchShopItems.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchShopItems.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      // Покупка товара (СТРАЖ МЕРЦАНИЯ: Массив товаров items не трогаем!)
      .addCase(fetchPurchaseItem.pending, (state) => {
        state.purchaseStatus = 'loading'
      })
      .addCase(fetchPurchaseItem.fulfilled, (state, ) => {
        state.purchaseStatus = 'succeeded'
      })
      .addCase(fetchPurchaseItem.rejected, (state, action) => {
        state.purchaseStatus = 'failed'
        state.error = action.payload
      })
  },
})

export const { resetShopStatus } = shopSlice.actions
export { fetchShopItems, fetchPurchaseItem }
export default shopSlice.reducer
