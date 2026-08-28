import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'
import { updateCoinsAndInventory } from './profileSlice' // Импортируем экшен из профиля

const fetchShopItems = createAsyncThunk(
  'shop/fetchShopItems',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('shop/get-all-items')
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
  async (
    { itemCode, deliveryAddress },
    { dispatch, rejectWithValue },
  ) => {
    try {
      const res = await axiosInstance.post('/shop/buy-item', {
        itemCode,
        deliveryAddress,
      })

      // Магия: при успешном ответе обновляем кошелек и инвентарь в profileSlice
      dispatch(
        updateCoinsAndInventory({
          coins: res.data.coins,
          inventory: res.data.inventory,
        }),
      )

      return res.data // { message: "...", coins: ..., inventory: ... }
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
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    purchaseStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
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
      // Покупка товара
      .addCase(fetchPurchaseItem.pending, (state) => {
        state.purchaseStatus = 'loading'
      })
      .addCase(fetchPurchaseItem.fulfilled, (state) => {
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
