// src/assets/data/exercises/level2/argument-speed/generator.js
import { argumentSpeedData } from './data'

let lastThesis = null

/**
 * Генерирует случайный тезис и позицию (ЗА/ПРОТИВ) для тренажера "Пулемет аргументов"
 * @returns {Object} { thesis: string, position: string }
 */
const getRandomArgumentTask = () => {
  const { theses, positions } = argumentSpeedData

  // Выбираем тезис без повтора подряд
  let randomThesis
  do {
    const index = Math.floor(Math.random() * theses.length)
    randomThesis = theses[index]
  } while (randomThesis === lastThesis && theses.length > 1)
  lastThesis = randomThesis

  // Выбираем случайную позицию (ЗА или ПРОТИВ)
  const randomPosition =
    positions[Math.floor(Math.random() * positions.length)]

  return {
    thesis: randomThesis,
    position: randomPosition,
  }
}

export { getRandomArgumentTask }
