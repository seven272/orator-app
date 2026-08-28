import bridge from '@vkontakte/vk-bridge'

const getScheme = () => {
  bridge.subscribe((evt) => {
    if (evt.detail.type === 'VKWebAppUpdateConfig') {
      // Логика дальнейших дейтсвий, отправляем данный акшеном в Редах, yb;t ghbvth
    //   console.log(evt.detail.data.scheme)
    //   dispatch(setScheme(evt.detail.data.scheme))
    }
  })
}

export { getScheme }
