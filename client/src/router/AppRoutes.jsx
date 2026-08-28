import { createHashRouter } from 'react-router-dom'

// 📌 Импортируем архитектурные макеты из папки layouts
import AppLayout from '../layouts/AppLayout'
import MainBaseLayout from '../layouts/main-base-layout/MainBaseLayout'
import ExercisesLayout from '../layouts/exercises-layout/ExercisesLayout'
import SecondaryLayout from '../layouts/secondary-layout/SecondaryLayout'

// 📌 Импортируем ваши страницы (панели)
import MainPage from '../panels/main-page/MainPage'
import AuthPage from '../panels/auth-page/AuthPage'
import ExercisesDailyPage from '../panels/exercises-daily-page/ExercisesDailyPage'
import ExercisesAllPage from '../panels/exercises-all-page/ExercisesAllPage'
import ExercisesLevelPage from '../panels/exercises-level-page/ExercisesLevelPage'
import ExercisePage from '../panels/exercise-page/ExercisePage'
import DashboardPage from '../panels/dashboard-page/DashboardPage'
import MiniDashboardPage from '../panels/mini-dashboard-page/MiniDashboardPage'
import LeaderboardPage from '../panels/leaderboard-page/LeaderboardPage'
import ShopPage from '../panels/shop-page/ShopPage'
import ChallengesPage from '../panels/challenges-page/ChallengesPage'
import AdminPage from '../panels/admin-page/AdminPage'
import LiveDuelPage from '../panels/live-duel-page/LiveDuelPage'
import LiveDuelJoinPage from '../panels/live-duel-join-page/LiveDuelJoinPage'
import CoursesPage from '../panels/courses-page/CoursesPage'
import SelectedCoursePage from '../panels/selected-course-page/SelectedCoursePage'

const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />, // Корневой технический макет (Redux-запросы, модалка, max-width 600px)
    children: [
      {
        path: '',
        element: <MainBaseLayout />, // Интерфейсный макет (Header и Footer всегда на экране)
        children: [
          // 🏠 Главная страница, авторизация и админка (уникальный фон настраивается в самих компонентах)
          { index: true, element: <MainPage /> },

          // 🤖 Группа страниц упражнений и тренажеров со своим общим фоном практики
          {
            path: '',
            element: <ExercisesLayout />,
            children: [
              { path: 'exercise/:alias', element: <ExercisePage /> },
            ],
          },

          // 📊 Группа остальных страниц (курсы, магазин, статистика) со своим фоном
          {
            path: '',
            element: <SecondaryLayout />,
            children: [
              { path: 'auth', element: <AuthPage /> },
              { path: 'admin', element: <AdminPage /> },
              {
                path: 'exercises-daily',
                element: <ExercisesDailyPage />,
              },
              {
                path: 'exercises-all',
                element: <ExercisesAllPage />,
              },
              {
                path: 'exercises/:level',
                element: <ExercisesLevelPage />,
              },
              { path: 'dashboard', element: <DashboardPage /> },
              {
                path: 'mini-dashboard',
                element: <MiniDashboardPage />,
              },
              { path: 'leaderboard', element: <LeaderboardPage /> },
              { path: 'shop', element: <ShopPage /> },
              { path: 'challenges', element: <ChallengesPage /> },
              { path: 'live-duel', element: <LiveDuelPage /> },
              {
                path: 'live-duel/join/:token',
                element: <LiveDuelJoinPage />,
              },
              { path: 'courses', element: <CoursesPage /> },
              {
                path: 'course/:courseCode',
                element: <SelectedCoursePage />,
              },
            ],
          },
        ],
      },
    ],
  },
])

export default router
