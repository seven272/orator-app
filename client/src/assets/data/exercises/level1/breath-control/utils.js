// src/assets/data/exercises/level1/breath-control/generator.js
import { breathControlData } from './data'

let lastTextId = null

/**
 * Генерирует случайное текстовое задание для тренажера "Выдох-Контроль"
 * @returns {Object} { text: string, difficulty: string }
 */
const getRandomBreathTask = () => {
  const { breathTexts } = breathControlData

  let randomTask
  do {
    const index = Math.floor(Math.random() * breathTexts.length)
    randomTask = breathTexts[index]
  } while (randomTask.id === lastTextId && breathTexts.length > 1)

  lastTextId = randomTask.id

  return {
    text: randomTask.text,
    difficulty: randomTask.difficulty,
  }
}

export { getRandomBreathTask }
