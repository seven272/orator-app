import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { message } from 'antd'

import axiosInstance from '../../utils/axiosInstance'

const fetchRegisterUser = createAsyncThunk(
  'auth/fetchRegisterUser',
  async (regData, { rejectWithValue }) => {
    console.log(regData)
    try {
      const res = await axiosInstance.post('/user/register', regData)
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Ошибка при регистрации'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchLoginUser = createAsyncThunk(
  'auth/fetchLoginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/user/login', {
        email,
        password,
      })
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Ошибка при входе'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchLogoutUser = createAsyncThunk(
  'auth/fetchLogoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/user/logout')
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Ошибка при выходе'
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchGetMe = createAsyncThunk(
  'auth/fetchGetMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/user/me')
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка при получении данных об авторизации'
      message.error(errorMsg)
      return rejectWithValue(errorMsg)
    }
  },
)

const fetchVkAuth = createAsyncThunk(
  'auth/fetchVkAuth',
  async (vkData, { rejectWithValue }) => {
    try {
      // Передаем launchParams и данные профиля (firstName, lastName, avatar)
      const res = await axiosInstance.post('/user/vk-auth', vkData)
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Ошибка входа через VK'
      return rejectWithValue(errorMsg)
    }
  },
)

// Редактирование профиля (имя, фамилия, никнейм, аватар)
const fetchUpdateProfile = createAsyncThunk(
  'auth/fetchUpdateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.put(
        '/user/update-profile',
        profileData,
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || 'Ошибка обновления профиля'
      return rejectWithValue(errorMsg)
    }
  },
)

// Привязка Email к VK-аккаунту
const fetchLinkEmail = createAsyncThunk(
  'auth/fetchLinkEmail',
  async (emailData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/user/link-email',
        emailData,
      )
      return res.data
    } catch (error) {
      // Если поймали конфликт 409 (Email занят) — возвращаем объект ошибки целиком
      if (error.response?.status === 409) {
        return rejectWithValue(error.response.data)
      }
      const errorMsg =
        error.response?.data?.message || 'Ошибка привязке Email'
      return rejectWithValue({ message: errorMsg })
    }
  },
)

// Обратная привязка VK к Email-аккаунту сайта
const fetchLinkVk = createAsyncThunk(
  'auth/fetchLinkVk',
  async (vkLinkData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/user/link-vk',
        vkLinkData,
      )
      return res.data
    } catch (error) {
      // Если поймали конфликт 409 (VK уже привязан к другому аккаунту)
      if (error.response?.status === 409) {
        return rejectWithValue(error.response.data)
      }
      const errorMsg =
        error.response?.data?.message || 'Ошибка привязке VK'
      return rejectWithValue({ message: errorMsg })
    }
  },
)

// Финальное слияние аккаунтов по выбору пользователя
const fetchMergeAccounts = createAsyncThunk(
  'auth/fetchMergeAccounts',
  async (mergeData, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post(
        '/user/merge-accounts',
        mergeData,
      )
      return res.data
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка при объединении аккаунтов'
      return rejectWithValue(errorMsg)
    }
  },
)

const initialState = {
  isLoading: true,
  isAdmin: false,
  user: null,
  error: null,
  mergeConflict: null, // Сюда запишем { code: 'EMAIL_ALREADY_TAKEN' или 'VK_ALREADY_TAKEN', targetUserId: '...' }
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearMergeConflict: (state) => {
      state.mergeConflict = null
    },
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // 1. РЕГИСТРАЦИЯ (Email / Пароль)
      // ==========================================
      .addCase(fetchRegisterUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRegisterUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user // Исправлено под структуру бэкенда
        state.isAdmin = action.payload?.user?.isAdmin || false
        state.error = null
      })
      .addCase(fetchRegisterUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // ==========================================
      // 2. ВХОД (Email / Пароль)
      // ==========================================
      .addCase(fetchLoginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLoginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user
        state.isAdmin = action.payload?.user?.isAdmin || false
        state.error = null
      })
      .addCase(fetchLoginUser.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.error = action.payload
      })

      // ==========================================
      // 3. ВЫХОД ИЗ СИСТЕМЫ
      // ==========================================
      .addCase(fetchLogoutUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLogoutUser.fulfilled, (state) => {
        state.isLoading = false
        state.user = null
        state.isAdmin = false
        state.error = null
        state.mergeConflict = null
      })
      .addCase(fetchLogoutUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // ==========================================
      // 4. ПРОВЕРКА АВТОРИЗАЦИИ (Get Me)
      // ==========================================
      .addCase(fetchGetMe.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchGetMe.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user
        state.isAdmin = action.payload?.user?.isAdmin || false
        state.error = null
      })
      .addCase(fetchGetMe.rejected, (state, action) => {
        state.isLoading = false
        state.user = null
        state.isAdmin = false
        state.error = action.payload
      })

      // ==========================================
      // 5. ВХОД / РЕГИСТРАЦИЯ ЧЕРЕЗ ВКОНТАКТЕ
      // ==========================================
      .addCase(fetchVkAuth.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchVkAuth.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user
        state.isAdmin = action.payload?.user?.isAdmin || false
        state.error = null
      })
      .addCase(fetchVkAuth.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // ==========================================
      // 6. РЕДАКТИРОВАНИЕ ДАННЫХ ПРОФИЛЯ
      // ==========================================
      .addCase(fetchUpdateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchUpdateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user // Заменяем старые данные профиля новыми
        state.error = null
      })
      .addCase(fetchUpdateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })

      // ==========================================
      // 7. ПРИВЯЗКА EMAIL К VK-АККАУНТУ (Конфликт 409)
      // ==========================================
      .addCase(fetchLinkEmail.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLinkEmail.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user // Email успешно привязан
        state.error = null
      })
      .addCase(fetchLinkEmail.rejected, (state, action) => {
        state.isLoading = false
        // Если поймали структурированный конфликт 409
        if (action.payload?.code) {
          state.mergeConflict = {
            code: action.payload.code,
            targetUserId: null, // При привязке почты бэкенд не возвращает ID, сверка идет по паролю
          }
        } else {
          state.error =
            action.payload?.message || 'Ошибка при привязке Email'
        }
      })

      // ==========================================
      // 8. ПРИВЯЗКА VK К EMAIL-АККАУНТУ (Конфликт 409)
      // ==========================================
      .addCase(fetchLinkVk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchLinkVk.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user // VK успешно привязан
        state.error = null
      })
      .addCase(fetchLinkVk.rejected, (state, action) => {
        state.isLoading = false
        // Если поймали структурированный конфликт 409
        if (action.payload?.code) {
          state.mergeConflict = {
            code: action.payload.code,
            targetUserId: action.payload.vkOwnerId || null, // Запоминаем ID аккаунта ВК для слияния
          }
        } else {
          state.error =
            action.payload?.message || 'Ошибка при привязке ВКонтакте'
        }
      })

      // ==========================================
      // 9. ФИНАЛЬНОЕ СЛИЯНИЕ АККАУНТОВ (ПОГЛОЩЕНИЕ)
      // ==========================================
      .addCase(fetchMergeAccounts.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMergeAccounts.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload?.user // Записываем итоговый выбранный профиль
        state.isAdmin = action.payload?.user?.isAdmin || false
        state.error = null
        state.mergeConflict = null // Закрываем окно слияния
      })
      .addCase(fetchMergeAccounts.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload
      })
  },
})
const checkIsAuth = (state) => Boolean(state.auth.user)
export const { clearMergeConflict } = authSlice.actions
export {
  fetchRegisterUser,
  fetchLoginUser,
  fetchGetMe,
  fetchLogoutUser,
  fetchVkAuth,
  fetchLinkVk,
  fetchLinkEmail,
  fetchMergeAccounts,
  fetchUpdateProfile,
  checkIsAuth,
}
export default authSlice.reducer
