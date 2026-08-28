import bridge from '@vkontakte/vk-bridge'

//поделиться приложением
const shareApp = async (url) => {
  try {
    const data = await bridge.send('VKWebAppShare', {
      link: `${url}`,
    })

    if (data.result) {
      // Запись размещена
      console.log('Запись размещена')
    }
  } catch (error) {
    // Ошибка
    console.log(error)
  }
}


//пост в истории
const sharePostOnWall = async (text, url) => {
  try {
    const data = await bridge.send('VKWebAppShowWallPostBox', {
      message: `${text}`,
      attachments: `${url}`,
    })

    if (data.post_id) {
      // Запись размещена
      console.log('Запись размещена')
    }
  } catch (error) {
    // Ошибка
    console.log(error)
  }
}

//рекомендовать приложение друзьям
const recommendApp = async () => {
  try {
    const data = await bridge.send('VKWebAppRecommend')
    if (data.result) {
      // Мини-приложение порекомендовано
      console.log('Мини-приложение порекомендовано')
    }
  } catch (error) {
    // Ошибка
    console.log(error)
  }
}

//добавить в избранное
const addFavoriteApp = async () => {
  try {
    const data = await bridge.send('VKWebAppAddToFavorites')
    if (data.result) {
      // Мини-приложение или игра добавлены в избранное
      console.log('Мини-приложение добавлено в избранное')
    }
  } catch (error) {
    // Ошибка
    console.log(error)
  }
}

export { shareApp, sharePostOnWall, recommendApp, addFavoriteApp }
