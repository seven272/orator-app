// src/assets/data/exercises/level1/speech-pace/generator.js
import { speechPaceData } from './data'

let lastText = null

/**
 * Генерирует случайный текст для тренажера "Метроном"
 * @returns {Object} { text: string }
 */
const getRandomPaceTask = () => {
  const { texts } = speechPaceData

  let randomText
  do {
    const index = Math.floor(Math.random() * texts.length)
    randomText = texts[index]
  } while (randomText === lastText && texts.length > 1)
  lastText = randomText

  return {
    text: randomText,
  }
}

export { getRandomPaceTask }
