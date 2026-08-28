const jargonTasks = [
  {
    id: 'fanya_1',
    situation:
      'Прохожий нахамил тебе в очереди. Как ответишь по-пацански?',
    // Слова, которые игрок видит на экране как шпаргалку
    displayWords: [
      'Рамсы попутал',
      'Батон крошишь',
      'Метлу фильтруй',
      'Обоснуй',
    ],
    // Основы слов для проверки через useSpeech (устойчивы к ошибкам окончаний)
    validationKeywords: [
      'рамс',
      'попут',
      'батон',
      'крош',
      'метл',
      'фильтр',
      'обоснуй',
    ],
    settings: {
      timeLimit: 30, // Общее время на упражнение
      goldThreshold: 15, // Лимит для получения 50 XP (после 15 сек — 5 XP)
      minKeywords: 1, // Минимальное кол-во слов из списка для зачета
    },
  },
  {
    id: 'fanya_2',
    situation:
      "Тебя спрашивают: 'Ты чё такой нарядный?'. Твой ответ?",
    displayWords: ['По масти', 'Прикид', 'Вопросы имеешь?', 'Шлёпки'],
    validationKeywords: ['маст', 'прикид', 'вопрос', 'шлепк'],
    settings: {
      timeLimit: 30,
      goldThreshold: 15,
      minKeywords: 1,
    },
  },
  {
    id: 'fanya_3',
    situation:
      'Тебе говорят: «Слышь, есть позвонить? А если найду?». Как ответишь по-пацански?',
    displayWords: ['Шмон', 'Валына', 'Оборзел', 'Масть теряешь'],
    validationKeywords: [
      'шмон',
      'найд',
      'валын',
      'оборзел',
      'маст',
      'теряешь',
    ],
    settings: {
      timeLimit: 30,
      goldThreshold: 15,
      minKeywords: 1,
    },
  },
  {
    id: 'fanya_4',
    situation:
      'Знакомый пытается тебя обмануть. Как скажешь, что ты не дурак?',
    displayWords: [
      'Лоха нашёл',
      'За фуфло',
      'Разводняк',
      'На понт берёшь',
    ],
    validationKeywords: ['лох', 'фуфл', 'развод', 'понт', 'берешь'],
    settings: {
      timeLimit: 30,
      goldThreshold: 15,
      minKeywords: 1,
    },
  },
  {
    id: 'fanya_5',
    situation:
      'Тебя просят сделать что-то стрёмное. Как резко откажешься?',
    displayWords: ['Западло', 'Не по масти', 'Попутал', 'Шняга'],
    validationKeywords: ['западло', 'маст', 'попут', 'шняг'],
    settings: {
      timeLimit: 30,
      goldThreshold: 15,
      minKeywords: 1,
    },
  }, 
]

export { jargonTasks }
