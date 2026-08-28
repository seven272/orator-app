import bridge from '@vkontakte/vk-bridge'

import { getBase64FromUrl } from './imgToBase64'
import ImgBlob from '../assets/images/forStory2.png'

// размещение записи в истории пользователя
const sharePostOnStory = async (textTop, textBotton) => {
  const img = await getBase64FromUrl(ImgBlob)
  const urlApp = 'https://vk.com/app52023743'
  try {
    const data = await bridge.send('VKWebAppShowStoryBox', {
      // Задаёт фон истории
      background_type: 'image', // Тип фона — картинка
      // url: 'https://example.com/v850136098/story-1.jpg', // Адрес картинки
      blob: img, // Адрес картинки в 64 формате
      locked: true, // Блокируем изменение размеров и положения фона

      // Кнопка внизу истории для перехода в игру
      attachment: {
        type: 'url', // Тип объекта — ссылка
        text: 'go_to', // Константа, которая определяет текст ссылки полный список констант тут https://dev.vk.com/ru/method/stories.getVideoUploadServer
        // "open" — «Открыть»
        // "game" — «Играть»
        // "go_to" — Перейти
        url: urlApp, // Адрес игры
      },

      // Дополнительные изобразительные элементы
      stickers: [
        // Текст в верхней части экрана
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              // Текст и его атрибуты
              text: textTop,
              style: 'cursive',
              background_style: 'neon',
              selection_color: '#4a0d13',
            },
            transform: {
              // Определяет положение текста
              gravity: 'center_top',
              translation_y: 0.15,
            },
          },
        },
        // Текст в нижней части экрана
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              // Текст и его атрибуты
              text: textBotton,
              style: 'marker',
              background_style: 'none',
              selection_color: '#4a0d13',
            },
            transform: {
              // Определяет положение текста
              gravity: 'center_bottom',
              translation_y: -0.15,
            },
          },
        },
      ],
    })

    if (data) {
      // История размещена...
      console.log('История успешно размещена у пользователя')
    }
  } catch (error) {
    console.log('Ошибка sharePostOnStory!', error)
  }
}

export { sharePostOnStory }
