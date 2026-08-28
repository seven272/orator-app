import { Root, SplitLayout } from '@vkontakte/vkui'
import { useActiveVkuiLocation } from '@vkontakte/vk-mini-apps-router'
import { useDispatch } from 'react-redux'
import { useEffect } from 'react'

import MainView from './views/MainView'
import AchievementModal from './components/achievement-modal/AchievementModal'
import { fetchGetMe } from './redux/slices/authSlice'
import { fetchProfileData } from './redux/slices/profileSlice'
import { fetchLeaderboard } from './redux/slices/leaderboardSlice'

const App = () => {
  const { panel, view } = useActiveVkuiLocation()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(fetchGetMe())
    dispatch(fetchProfileData())
    dispatch(fetchLeaderboard())
  }, [dispatch])

  return (
    <SplitLayout>
      <Root activeView={view}>
        <MainView id="main_view" activePanel={panel} />
      </Root>
      <AchievementModal />
    </SplitLayout>
  )
}

export default App
