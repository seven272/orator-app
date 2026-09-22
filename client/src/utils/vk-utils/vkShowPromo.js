import bridge from '@vkontakte/vk-bridge'

const showPromo = async () => {
  try {
    const data = await bridge.send('VKWebAppShowBannerAd', {
      banner_location: 'bottom',
    })
    if (data.result) {
      // Баннерная реклама отобразилась
      console.log('Показывается реклама')
    }
  } catch (error) {
    console.log(error)
    console.log('Ошибка при показе рекламы')
  }
}

export { showPromo }
