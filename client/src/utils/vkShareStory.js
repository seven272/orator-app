// utils/shareExerciseResultToStory.js
import bridge from '@vkontakte/vk-bridge'
import { convertBase64FromUrl } from './convertToBase64'
import ImgBlobStandard from '../assets/images/other/vk_story.jpeg' // Шаблон фона
import ImgBlobPremium from '../assets/images/other/vk_story_2.jpeg'
import { All_EXERCISES } from '../assets/mocks/exercises'

/**
 * Размещение результатов тренажеров 1 и 2 уровня в Истории ВКонтакте
 * @param {Object} exercise - Объект тренажера из ALL_EXERCISES
 */
const shareExerciseResultToStory = async (exercise) => {
  if (!exercise)
    return { success: false, error: 'Данные тренажера отсутствуют' }

  const { title, description } = exercise

  try {
    // Конвертируем изображение в Base64 формат (передача через blob)
    const imgBase64 = await convertBase64FromUrl(ImgBlobStandard)

    // Формируем ссылку для перехода друзей из истории в мини-приложение с реферальными метками
    const urlApp = `https://vk.ru/app54762318`

    // Верхний стикер: Название упражнения
    const textTop = `🎉 Пройдено: тренажер «${title}»!`

    // Нижний стикер: Описание тренажера (с ограничением длины)
    const shortDesc =
      description.length > 50
        ? `${description.substring(0, 47)}...`
        : description
    const textBottom = `${shortDesc}. Сможешь так же? 🔥`

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
              translation_y: -0.33, // Подняли выше, чтобы не наползало на маскота
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

//AI тренажеры
const shareAiExerciseResultToStory = async (exAlias, verdict) => {
  const currentExercise = All_EXERCISES.level3
    .find((ex) => ex?.alias === exAlias)

  if (!currentExercise) {
    console.error(
      `ИИ-Тренажер с алиасом "${exAlias}" не найден в ALL_EXERCISES`,
    )
    return { success: false }
  }

  const { title } = currentExercise

  try {
    // Используем премиальный ИИ-шаблон (кибер-птица в золотой рамке)
    const imgBase64 = await convertBase64FromUrl(ImgBlobPremium)

    // Зашиваем точный балл ИИ в параметры перехода приложения
    const urlApp = `https://vk.ru/app54762318`

    const textTop = `🏆 Успех в ИИ-тренажере «${title}»!`
    const textBottom = `🤖 ИИ-тренер оценил мою речь на ${verdict.totalScore} из 100! Попробуй побить?`

    const data = await bridge.send('VKWebAppShowStoryBox', {
      background_type: 'image',
      blob: imgBase64,
      locked: true,
      attachment: {
        type: 'url',
        text: 'game', // Нативная кнопка «Играть»
        url: urlApp,
      },
      stickers: [
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              text: textTop,
              style: 'cursive',
              background_style: 'neon',
              selection_color: '#ffffff', // Контрастный белый текст на темно-синем фоне
            },
            transform: {
              gravity: 'center_top',
              translation_y: 0.15,
            },
          },
        },
        {
          sticker_type: 'native',
          sticker: {
            action_type: 'text',
            action: {
              text: textBottom,
              style: 'marker',
              background_style: 'black', // Темная плашка для идеальной читаемости
              selection_color: '#ffffff', // Контрастный белый текст
            },
            transform: {
              gravity: 'center_bottom',
              translation_y: -0.38, // Подняли текст существенно выше, чтобы не перекрывать птицу
            },
          },
        },
      ],
    })

    return { success: !!data }
  } catch (error) {
    console.error('Ошибка публикации ИИ-истории (3 уровень):', error)
    return { success: false, error }
  }
}

export { shareExerciseResultToStory, shareAiExerciseResultToStory }
