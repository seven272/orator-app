const getRandomNumber = (min, max) => {
  min = Math.ceil(min) // округляем до ближайшего большего целого
  max = Math.floor(max) // округляем до ближайшего меньшего целого
  return Math.floor(Math.random() * (max - min + 1)) + min // генерируем случайное целое число
}

//это функция замыкание, ее нужно вызвать в другой функции например так const getWord = getRandomWord(similarWords)
const getRandomWord = (arr) => {
  let stack = []

  return () => {
    if (arr.length === 0) return ''

    // Если колода пуста, создаем новую и перемешиваем
    if (stack.length === 0) {
      // Копируем массив, чтобы не испортить оригинал
      stack = [...arr]
      // Алгоритм Тасования Фишера — Йетса (самый честный рандом)
      for (let i = stack.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[stack[i], stack[j]] = [stack[j], stack[i]]
      }
    }

    // Забираем последнее слово из перемешанного стека
    return stack.pop()
  }
}

const getRandomPairWords = (arr) => {
  if (arr.length < 2)
    return { word1: arr[0] || '', word2: arr[0] || '' }

  const idx1 = Math.floor(Math.random() * arr.length)
  let idx2

  // Генерируем второй индекс, пока он совпадает с первым
  do {
    idx2 = Math.floor(Math.random() * arr.length)
  } while (idx1 === idx2)

  return { word1: arr[idx1], word2: arr[idx2] }
}

export { getRandomPairWords, getRandomNumber, getRandomWord }
