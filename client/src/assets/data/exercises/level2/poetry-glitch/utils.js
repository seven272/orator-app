// src/assets/data/exercises/level2/poetry-glitch/generator.js
import { poetryGlitchData } from './data'

let lastPoemId = null

/**
 * Генерирует случайное стихотворение для тренажера "Поэтический Сбой"
 * @returns {Object} { author: string, visibleLines: Array, hiddenLine: string }
 */
const getRandomPoemTask = () => {
  const { poems } = poetryGlitchData

  let randomTask
  do {
    const index = Math.floor(Math.random() * poems.length)
    randomTask = poems[index]
  } while (randomTask.id === lastPoemId && poems.length > 1)

  lastPoemId = randomTask.id

  return {
    author: randomTask.author,
    visibleLines: randomTask.visibleLines,
    hiddenLine: randomTask.hiddenLine,
  }
}

export { getRandomPoemTask }
