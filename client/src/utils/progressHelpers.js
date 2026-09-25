// Конфиг уровней: от Семьи на кухне до Олимпийского
const PROGRESS_STAGES = [
  { minXp: 0, maxXp: 10000, title: 'начинающий', audience: 'Кухня (Семья и кот, 1-3 чел)', mic: '🎙️', desc: 'Тестирую навыки на самых близких.' },
  { minXp: 10001, maxXp: 50000, title: 'уверенный', audience: 'Офис / Локальный бар (15-30 чел)', mic: '🎤', desc: 'Внимательно слушают в компании.' },
  { minXp: 50001, maxXp: 200000, title: 'профи', audience: 'Конференц-зал TED (200-500 чел)', mic: '🎧', desc: 'Держу фокус целого зала.' },
  { minXp: 200001, maxXp: 500000, title: 'мастер', audience: 'Концерт-холл (3 000 - 5 000 чел)', mic: '📻', desc: 'Вдохновляю тысячи сердец.' },
  { minXp: 500001, maxXp: Infinity, title: 'легенда', audience: 'Стадион «Олимпийский» (30 000+)', mic: '👑', desc: 'Голос, меняющий стадионы!' }
]
 
const getSpeakerProgress = (xp = 0) => {
  const currentStage = PROGRESS_STAGES.find(stage => xp >= stage.minXp && xp <= stage.maxXp) || PROGRESS_STAGES[0]
  
  // Расчет процента заполнения полосы прогресса на текущем уровне
  let percent = 0
  if (currentStage.maxXp === Infinity) {
    percent = 100
  } else {
    const range = currentStage.maxXp - currentStage.minXp
    const earned = xp - currentStage.minXp
    percent = Math.min(Math.max((earned / range) * 100, 0), 100)
  }

  return { ...currentStage, percent }
}
export {getSpeakerProgress}