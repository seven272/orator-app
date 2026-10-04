import { abstractConcepts } from './data'

// Функция генерации случайного задания
const getRandomZoomTask = () => {
  // Выбираем случайное понятие
  const randomIndex = Math.floor(
    Math.random() * abstractConcepts.length,
  )
  const concept = abstractConcepts[randomIndex]

  // Список разрешенных букв русского алфавита (исключаем редкие и непроизносимые)
  const allowedLetters = 'АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЭЮЯ'
  const randomLetter =
    allowedLetters[Math.floor(Math.random() * allowedLetters.length)]

  return {
    concept,
    letter: randomLetter,
  }
}

export { getRandomZoomTask }
