import { SKILLS_MAP } from '../constants/skills.js'

// Делает первую букву заглавной: "техника речи" -> "Техника речи"
const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Возвращает массив опций для фильтров и селектов: [{ key: 'техника речи', label: 'Техника речи' }]
export const getSkillOptions = () => {
  if (!SKILLS_MAP) return []

  return Object.keys(SKILLS_MAP).map((key) => ({
    key,
    label: capitalize(key),
  }))
}

// Возвращает красивое название навыка по его ключу
export const getSkillLabel = (tag) => {
  if (!tag) return ''
  return capitalize(tag)
}

// Возвращает массив алиасов тренажеров, относящихся к навыку
export const getExercisesBySkill = (tag) => {
  if (!tag || !SKILLS_MAP[tag]) return []
  return SKILLS_MAP[tag]
}
