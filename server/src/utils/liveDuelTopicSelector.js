import { DUEL_TOPICS } from '../constants/duelTopics.js'

const generateDuelData = () => {
  // 1. Выбираем случайный индекс из массива
  const randomIndex = Math.floor(Math.random() * DUEL_TOPICS.length)
  const topic = DUEL_TOPICS[randomIndex]

  // 2. Случайно определяем, будет ли ИИ "За" или "Против"
  const isOrderSideA = Math.random() < 0.5

  return {
    title: topic.title,
    sideA: isOrderSideA ? topic.sideA : topic.sideB,
    sideB: isOrderSideA ? topic.sideB : topic.sideA,
  }
}

export default generateDuelData