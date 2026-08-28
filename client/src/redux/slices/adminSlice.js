// slices/adminSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../../utils/axiosInstance'

const fetchAdminAnalytics = createAsyncThunk(
  'admin/fetchAdminAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      // Предполагается, что базовый URL и токен авторизации настроены в инстансе axios
      const res = await axiosInstance.get('/admin/statistics')
      return res.data.data
    } catch (error) {
      return rejectWithValue(
        error.res?.data?.message || 'Не удалось загрузить аналитику',
      )
    }
  }, 
)

const fetchAdminUsers = createAsyncThunk(
  'admin/fetchAdminUsers',
  async ({ page, search }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/admin/user-list?page=${page}&search=${search}`,
      )

      return res.data
    } catch (error) {
      return rejectWithValue(
        error.res?.data?.message || 'Ошибка загрузки пользователей',
      )
    }
  },
)

const fetchToggleUserPremium = createAsyncThunk(
  'admin/fetchToggleUserPremium',
  async (userId, { rejectWithValue }) => {
    console.log(userId)
    try {
      const res = await axiosInstance.post(
        `/admin/toggle-premium/${userId}`,
      )
      console.log(res.data)
      return { userId, isPremium: res.data.isPremium }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка изменения премиума',
      )
    }
  },
)

const fetchDeleteUserById = createAsyncThunk(
  'admin/fetchDeleteUserById',
  async (userId, { rejectWithValue }) => {
    console.log(userId)
    try {
      await axiosInstance.delete(`/admin/delete-user/${userId}`)
      return userId
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка при удалении',
      )
    }
  },
)

const fetchAdminMerchOrders = createAsyncThunk(
  'admin/fetchAdminMerchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/admin/merch-orders')
      return response.data.orders
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          'Ошибка загрузки заказов мерча',
      )
    }
  },
)

const fetchToggleOrderShipped = createAsyncThunk(
  'admin/fetchToggleOrderShipped',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.patch(
        `/admin/toggle-status-merch/${orderId}`,
      )
      return { orderId, is_shipped: res.data.is_shipped }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Ошибка обновления статуса',
      )
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    analytics: null,
    users: [],
    total_pages: 1,
    current_page: 1,
    merch_orders: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAdminState: (state) => {
      state.analytics = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminAnalytics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAdminAnalytics.fulfilled, (state, action) => {
        state.loading = false
        state.analytics = action.payload
      })
      .addCase(fetchAdminAnalytics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      // get users list
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.users = action.payload.users
        state.total_pages = action.payload.total_pages
        state.current_page = action.payload.current_page
      })
      // toggle premium user
      .addCase(fetchToggleUserPremium.fulfilled, (state, action) => {
        const { userId, isPremium } = action.payload
        // Локально обновляем статус юзера в массиве, чтобы не перезапрашивать весь список с сервера
        const user = state.users.find((u) => u._id === userId)
        if (user) {
          user.isPremium = isPremium
        }
      })
      // Удаление пользователя из локального стейта без перезагрузки страницы
      .addCase(fetchDeleteUserById.fulfilled, (state, action) => {
        state.users = state.users.filter(
          (u) => u._id !== action.payload,
        )
      })
      //список заказов физических товаров
      .addCase(fetchAdminMerchOrders.fulfilled, (state, action) => {
        state.merch_orders = action.payload
      })
      //изменяю статус заказа для мерча
      .addCase(fetchToggleOrderShipped.fulfilled, (state, action) => {
        const order = state.merch_orders.find(
          (o) => o.order_id === action.payload.orderId,
        )
        if (order) order.is_shipped = action.payload.is_shipped
      })
  },
})

export const { clearAdminState } = adminSlice.actions
export {
  fetchAdminAnalytics,
  fetchToggleUserPremium,
  fetchAdminUsers,
  fetchDeleteUserById,
  fetchAdminMerchOrders,
  fetchToggleOrderShipped,
}
export default adminSlice.reducer
