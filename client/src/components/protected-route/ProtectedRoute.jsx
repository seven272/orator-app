// components/protected-route/ProtectedRoute.jsx
import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = ({ onlyAdmin = false }) => {
  // Забираем данные о пользователе и статус загрузки сессии из authSlice
  const { user, isLoading } = useSelector((state) => state.auth)

  // Пока идет первичная проверка токена (fetchGetMe), показываем лоадер
  if (isLoading) {
    return <div style={{ textCenter: 'center', padding: '40px' }}>Проверка прав...</div>
  }

  // Если пользователя нет в системе вообще — отправляем на логин
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Если роут админский, а у пользователя флаг isAdmin равен false — шлем на 403
  if (onlyAdmin && !user.isAdmin) {
    return <Navigate to="/forbidden" replace /> // Наш явный роут для страницы 403
  }

  // Если все проверки пройдены — разрешаем рендеринг страницы
  return <Outlet />
}

export default ProtectedRoute
