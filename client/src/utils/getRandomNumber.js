  const getRandomNumber = (min, max) => {
    min = Math.ceil(min) // округляем до ближайшего большего целого
    max = Math.floor(max) // округляем до ближайшего меньшего целого
    return Math.floor(Math.random() * (max - min + 1)) + min // генерируем случайное целое число
  }

  export default getRandomNumber