import vkBridge, {
  parseURLSearchParamsForGetLaunchParams,
} from '@vkontakte/vk-bridge'
import {
  useAdaptivity,
  useAppearance,
  useInsets,
} from '@vkontakte/vk-bridge-react'
import {
  AdaptivityProvider,
  ConfigProvider,
  AppRoot,
} from '@vkontakte/vkui'
// 📌 Импортируем стандартный RouterProvider из react-router-dom
import { RouterProvider } from 'react-router-dom'
import { Provider } from 'react-redux'
import '@vkontakte/vkui/dist/vkui.css'

import transformVKBridgeAdaptivity from './utils/transformVKBridgeAdaptivity'
import router from './router/AppRoutes' // Ваша новая конфигурация маршрутов
import store from './redux/store'
import './assets/styles/index.css'

const AppConfig = () => {
  const vkBridgeAppearance = useAppearance() || undefined
  const vkBridgeInsets = useInsets() || undefined
  const adaptivity = transformVKBridgeAdaptivity(useAdaptivity())
  const { vk_platform } = parseURLSearchParamsForGetLaunchParams(
    window.location.search,
  )

  return (
    <ConfigProvider
      appearance={vkBridgeAppearance}
      platform={vk_platform === 'desktop_web' ? 'vkcom' : undefined}
      isWebView={vkBridge.isWebView()}
      hasCustomPanelHeaderAfter={true}
    >
      <AdaptivityProvider {...adaptivity}>
        <AppRoot mode="full" safeAreaInsets={vkBridgeInsets}>
          <Provider store={store}>
         
            <RouterProvider router={router} />
          </Provider>
        </AppRoot>
      </AdaptivityProvider>
    </ConfigProvider>
  )
}
export default AppConfig
