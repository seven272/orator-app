// src/assets/data/exercises/level1/antonym-clash/generator.js
import { antonymClashData } from './data'

let lastTextId = null

/**
 * Генерирует случайное задание для тренажера "Риторический Перевертыш"
 * @returns {Object} { text: string, keys: Array }
 */
const getRandomClashTask = () => {
  const { clashTexts } = antonymClashData

  let randomTask
  do {
    const index = Math.floor(Math.random() * clashTexts.length)
    randomTask = clashTexts[index]
  } while (randomTask.id === lastTextId && clashTexts.length > 1)

  lastTextId = randomTask.id

  return {
    text: randomTask.text,
    keys: randomTask.keys,
  }
}
export { getRandomClashTask }
