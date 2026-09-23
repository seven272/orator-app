import bridge from '@vkontakte/vk-bridge'
import ImgOnboarding from '../../assets/images/other/onboarding.jpeg'
import { convertBase64FromUrl } from '../convertToBase64'

// ф-ий отправки флага о показе Онбординга в ВКсторадж и ф-я получения информации о показе
const setOnboardingShown = () => {
  return bridge.send('VKWebAppStorageSet', {
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
  const imgForOnboarding = await convertBase64FromUrl(ImgOnboarding)

  // получаем информацию о "флаге" из хранилища о том были ли уже показа онбодинг, если да то прекращаю выполнения ф-и
  const isShown = getOnboardingShown()
  if (isShown) {
    return
  }
  try {
    const data = bridge.send('VKWebAppShowSlidesSheet', {
      slides: [
        {
          media: {
            blob: `${imgForOnboarding}`,
            type: 'image',
          },
          title: 'Мечтаете говорить уверенно и убедительно? GovoriX — ваш персональный тренер по риторике.',
          subtitle:
            '- Уникальные речевые тренажеры\n\n- Мгновенная оценка выступлений от ИИ-тренера\n\n- Игровая подача, обширная статистика и доступная  теория\n\nЗапускайте первый тренажер и говорите уверенно!',
        },
      ],
    })

    if (data.result) {
      // Слайды показаны
      setOnboardingShown()
    }
  } catch (error) {
    // Ошибка
    console.log('ошибка в показе онбординга VK ', error)
  }
}

export { showOnboarding }
