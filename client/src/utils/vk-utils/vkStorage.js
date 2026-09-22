import bridge from '@vkontakte/vk-bridge'

const setElemInCollection = (payload) => {
  return bridge.send('VKWebAppStorageSet', {
    key: 'listPictures',
    value: JSON.stringify(payload),
  })
}
// сохроняем данные в ВКсторадж
const setDataFromVkStorage = (name = '', payload) => {
  return bridge.send('VKWebAppStorageSet', {
    key: name,
    value: JSON.stringify(payload),
  })
}


const getAllItemsStorage = () => {
  bridge
    .send('VKWebAppStorageGetKeys', {
      count: 10,
      offset: 0,
    }) 
    .then((data) => {
      try {
        let arrKeys = []
        console.log(data.keys)
        return (arrKeys = data.keys)
      } catch {
        console.log('Ошибка в получении всех ключей')
      }
    })
    .then((arrKeys) => {
      try {
        arrKeys.forEach((item) => {
          bridge
            .send('VKWebAppStorageGet', {
              keys: [item],
            })
            .then((data) => {
              try {
                console.log(JSON.parse(data.keys[0].value))
              } catch {
                console.log('Error')
              }
            })
        })
      } catch (error) {
        console.log(error)
      }
    })
}

// сохранение состояние просмотренного онбординга
const setOnboardingShown = () => {
  return bridge.send('VKWebAppStorageSet', {
    key: 'onboardingShownPrankSound',
    value: '1',
  })
}

// получение состояние просмотренного онбординга
const getOnboardingShown = async () => {
  const result = await bridge.send('VKWebAppStorageGet', {
    keys: ['onboardingShownPrankSound'],
  })
  // получением значение первого элемента массива обьектов keys
  const resultValue = result.keys[0].value
  if (resultValue === '') {
    return false
  } else if (resultValue === '1') {
    return true
  }
}

// сохранение темы в ВК-сторадж
const setThemeStorage = (payload) => {
  return bridge.send('VKWebAppStorageSet', {
    key: 'themeAppCalcPicture', // название ключа для каждого приложения должн быть уникальным
    value: payload,
  })
}

// получение выбранной темы пользователем
const getThemeStorage = async () => {
  try {
    const result = await bridge.send('VKWebAppStorageGet', {
      keys: ['themeAppPicBirthday'],
    })
    // получением значение первого элемента массива обьектов keys
    const resultValue = result.keys[0].value
    console.log('получаю  тему из Хранилища ' + resultValue)
    return resultValue
  } catch (error) {
    console.log('ошибки при получении темы из ВК-сторадж ' + error)
  }
}

export {
  setDataFromVkStorage,
  setElemInCollection,
  getAllItemsStorage,
  setOnboardingShown,
  getOnboardingShown,
  setThemeStorage,
  getThemeStorage,
}
