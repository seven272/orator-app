// utils/shareExerciseResultToStory.js
import bridge from '@vkontakte/vk-bridge'
import { convertBase64FromUrl } from './convertToBase64'
import ImgBlob from '../assets/images/other/vk_story.jpeg' // Шаблон фона

/**
 * Размещение результатов тренажеров 1 и 2 уровня в Истории ВКонтакте
 * @param {Object} exercise - Объект тренажера из ALL_EXERCISES
 */
const shareExerciseResultToStory = async (exercise) => {
  if (!exercise)
    return { success: false, error: 'Данные тренажера отсутствуют' }

  const { level, title, description } = exercise

  try {
    // Конвертируем изображение в Base64 формат (передача через blob)
    const imgBase64 = await convertBase64FromUrl(ImgBlob)

    // Формируем ссылку для перехода друзей из истории в мини-приложение с реферальными метками
    const urlApp = `https://vk.ru/app54762318`

    // Верхний стикер: Название упражнения
    const textTop = `Пройдено: тренажер «${title}»!`

    // Нижний стикер: Описание тренажера (с ограничением длины)
    const shortDesc =
      description.length > 50
        ? `${description.substring(0, 47)}...`
        : description
    const textBottom = `🗣️ ${shortDesc}. Сможешь так же?`

    const data = await bridge.send('VKWebAppShowStoryBox', {
      background_type: 'image',
      blob: imgBase64,
      locked: true, // Фиксируем фон

      // Кнопка перехода в мини-приложение
      attachment: {
        type: 'url',
        text: 'game', // Отобразит нативную кнопку «Играть»
        url: urlApp,
      },

      // Текстовые стикеры поверх картинки
      stickers: [
        // Верхний текст: Название упражнения
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              text: textTop,
              style: 'cursive',
              background_style: 'neon',
              selection_color: '#ffffff', // Белый цвет текста для контраста
            },
            transform: {
              gravity: 'center_top',
              translation_y: 0.15,
            },
          },
        },
        // 🤖 ОБНОВЛЕНО: Нижний текст поднят выше (translation_y: -0.28) и сделан контрастным
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              text: textBottom,
              style: 'marker',
              background_style: 'black', // Добавляем темную аккуратную плашку под текст для идеальной читаемости
              selection_color: '#ffffff', // Строго белый контрастный шрифт на темно-синем фоне
            },
            transform: {
              gravity: 'center_bottom',
              translation_y: -0.28, // Подняли выше, чтобы не наползало на маскота
            },
          },
        },
      ],
    })

    if (data) {
      console.log(
        `История для тренажера ${exercise.alias} успешно опубликована.`,
      )
      return { success: true }
    }
  } catch (error) {
    console.error('Ошибка публикации истории в ВК:', error)
    return { success: false, error }
  }
}

export { shareExerciseResultToStory }
