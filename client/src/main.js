import { createRoot } from 'react-dom/client'
import vkBridge from '@vkontakte/vk-bridge'
import AppConfig from './AppConfig.jsx'

// 📌 Запускаем инициализацию только если мы внутри WebView VK или в URL есть VK-параметры
if (vkBridge.isWebView() || window.location.search.includes('vk_')) {
  vkBridge.send('VKWebAppInit').catch((err) => console.log('VK Bridge Init Error:', err))
}

createRoot(document.getElementById('root')).render(<AppConfig />)
