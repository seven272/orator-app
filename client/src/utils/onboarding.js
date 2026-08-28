import bridge from '@vkontakte/vk-bridge'
import ImgOnboarding from '../assets/images/onboarding.jpeg'
import { convertBase64FromUrl } from './convertToBase64'
// ф-ий отправки флага о показе Онбординга в ВКсторадж и ф-я получения информации о показе
import { setOnboardingShown, getOnboardingShown } from './vkStorage'

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
          title: 'Добро пожаловать!',
          subtitle:
            'Любите смешные розыгрыши? Тогда приложение «Наглые звуки» — то, что вы искали. Более 30 звуковых пранков, таймер задержки воспроизведения и удобный интерфейс. ',
        },
      ],
    })

    if (data.result) {
      // Слайды показаны
      setOnboardingShown()
    }
  } catch (error) {
    // Ошибка
    console.log(error)
  }
}

export { showOnboarding }
