import bridge from '@vkontakte/vk-bridge'
import ImgOnboarding from '../../assets/images/other/onboarding.jpeg'
import { convertBase64FromUrl } from '../convertToBase64'

// ф-ий отправки флага о показе Онбординга в ВКсторадж и ф-я получения информации о показе
const setOnboardingShown = async () => {
  return await bridge.send('VKWebAppStorageSet', {
    key: 'govorix_onboarding',
    value: '1',
  })
}

// получение состояние просмотренного онбординга
const getOnboardingShown = async () => {
  const result = await bridge.send('VKWebAppStorageGet', {
    keys: ['govorix_onboarding'],
  })
  // получением значение первого элемента массива обьектов keys
  const resultValue = result.keys[0].value
  if (resultValue === '') {
    return false
  } else if (resultValue === '1') {
    return true
  }
}

const showOnboarding = async () => {
  console.log('START ONBORDING VK')
  const imgForOnboarding = await convertBase64FromUrl(ImgOnboarding)

  // получаем информацию о "флаге" из хранилища о том были ли уже показа онбодинг, если да то прекращаю выполнения ф-и
  const isShown = await getOnboardingShown()

  if (!isShown) {
    return
  }
  try {
    const data = await bridge.send('VKWebAppShowSlidesSheet', {
      slides: [
        {
          media: {
            blob: `${imgForOnboarding}`,
            type: 'image',
          },
          title: 'Хотите говорить уверенно и убедительно?',
          subtitle:
            'GovoriX — ваш персональный тренер по риторике. Уникальные речевые тренажеры,доступная теория, игровая подача, обширная статистика. За дело!',
        },
      ],
    })

    if (data.result) {
      console.log('Слайды успешно показаны, фиксируем флаг...')
      await setOnboardingShown()
    }
  } catch (error) {
    // Ошибка
    console.log('ошибка в показе онбординга VK ', error)
  }
}

export { showOnboarding }
