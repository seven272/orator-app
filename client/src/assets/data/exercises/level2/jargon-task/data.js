const jargonTasks = [
  // --- Ваши исходные 5 ситуаций ---
  {
    id: 'fanya_1',
    situation:
      'Прохожий нахамил тебе в очереди. Как ответишь по-пацански?',
    displayWords: [
      'Рамсы попутал',
      'Батон крошишь',
      'Метлу фильтруй',
      'Обоснуй',
    ],
    validationKeywords: [
      'рамс',
      'попут',
      'батон',
      'крош',
      'метл',
      'фильтр',
      'обоснуй',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_2',
    situation:
      "Тебя спрашивают: 'Ты чё такой нарядный?'. Твой ответ?",
    displayWords: ['По масти', 'Прикид', 'Вопросы имеешь?', 'Шлёпки'],
    validationKeywords: ['маст', 'прикид', 'вопрос', 'шлепк'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
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
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
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
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_5',
    situation:
      'Тебя просят сделать что-то стрёмное. Как резко откажешься?',
    displayWords: ['Западло', 'Не по масти', 'Попутал', 'Шняга'],
    validationKeywords: ['западло', 'маст', 'попут', 'шняг'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },

  // --- Новые ситуации (до 20 штук) ---
  {
    id: 'fanya_6',
    situation:
      'Кто-то на парковке подпёр твою машину и не извиняется. Как предъявишь за дерзость?',
    displayWords: [
      'Косяк твой',
      'Края видишь?',
      'По понятиям',
      'Беспредел',
    ],
    validationKeywords: ['косяк', 'края', 'понят', 'беспредел'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_7',
    situation:
      'Тебе предъявляют за то, чего ты точно не делал. Как снимешь с себя обвинения?',
    displayWords: [
      'Не при делах',
      'Гнилой базар',
      'Стрелки переводишь',
      'Клевета',
    ],
    validationKeywords: [
      'дел',
      'гнило',
      'базар',
      'стрелк',
      'перевод',
      'клевет',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_8',
    situation:
      'Незнакомая компания на районе кричит тебе вслед: «Эй, иди сюда быстро!». Твой ответ?',
    displayWords: [
      'Чё за кипиш?',
      'По делу говори',
      'Шевелись сам',
      'Маякуй оттуда',
    ],
    validationKeywords: ['кипиш', 'дел', 'говори', 'шевель', 'маяк'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_9',
    situation:
      'Приятель просит занять крупную сумму без гарантий. Как откажешь, чтобы не выглядеть жадным?',
    displayWords: [
      'На мели',
      'Голяк',
      'По нулям',
      'Лавэ не крутится',
    ],
    validationKeywords: ['мели', 'голяк', 'нул', 'лавэ', 'крутит'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_10',
    situation:
      'Кто-то слишком долго и пристально смотрит на тебя в вагоне метро. Как спросишь, в чём дело?',
    displayWords: [
      'Чё вылупился?',
      'Проблемы?',
      'Кадр смазал',
      'Глаза продал',
    ],
    validationKeywords: [
      'вылуп',
      'проблем',
      'кадр',
      'смаз',
      'глаз',
      'прода',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_11',
    situation:
      'В споре тебе приводят аргумент, который звучит как полная чушь. Как прокомментируешь?',
    displayWords: [
      'Дичь какая-то',
      'Пургу неси',
      'Ересь',
      'Туфту гонишь',
    ],
    validationKeywords: ['дичь', 'пург', 'ересь', 'туфт', 'гон'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_12',
    situation:
      'Тебя зовут на «серьёзный разговор» один на один. Как покажешь, что ты не боишься стрелки?',
    displayWords: [
      'Забьёмся',
      'Перетрем',
      'Без базара',
      'В любое время',
    ],
    validationKeywords: [
      'забь',
      'перетр',
      'базар',
      'в любол',
      'врем',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_13',
    situation:
      'Знакомый хвастается дешёвой вещью, выдавая её за брендовую. Как подловишь его на вранье?',
    displayWords: [
      'Палево',
      'Фейк голимый',
      'Ширпотреб',
      'Штукатурка',
    ],
    validationKeywords: [
      'палев',
      'фейк',
      'голим',
      'ширпотреб',
      'штукатурк',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_14',
    situation:
      'Товарищ испугался мелкой разборки и хочет уйти. Как подначишь его остаться?',
    displayWords: [
      'Сдал назад',
      'Очкуешь',
      'Сдрейфил',
      'В кусты присел',
    ],
    validationKeywords: [
      'сдал',
      'назад',
      'очку',
      'сдрейф',
      'куст',
      'присел',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_15',
    situation:
      'Кто-то в компании начал выдавать чужие секреты. Как резко осадишь болтуна?',
    displayWords: [
      'Рот на замке',
      'Слейся',
      'Секреты сливаешь',
      'Хавальник завали',
    ],
    validationKeywords: [
      'рот',
      'замк',
      'слей',
      'секрет',
      'слив',
      'хавальн',
      'завал',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_16',
    situation:
      'Тебя просят быстро решить сложный вопрос, в котором ты вообще не разбираешься. Что ответишь?',
    displayWords: [
      'Не всосал',
      'Без понятия',
      'Тёмный лес',
      'Мимо кассы',
    ],
    validationKeywords: [
      'всос',
      'понят',
      'темн',
      'лес',
      'мимо',
      'касс',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_17',
    situation:
      'Тебе пытаются втереть какую-то сомнительную сделку или схему. Как покажешь подозрение?',
    displayWords: [
      'Мутная тема',
      'Разводилово',
      'Кидалово пахнет',
      'Подвох',
    ],
    validationKeywords: [
      'мутн',
      'тем',
      'развод',
      'кидал',
      'пахн',
      'подвох',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_18',
    situation:
      'Твой друг совершил крутой и дерзкий поступок. Как выразишь ему свой респект?',
    displayWords: ['Красава', 'Чётко сделал', 'Уважуха', 'От души'],
    validationKeywords: ['красав', 'четк', 'сдел', 'уважух', 'душ'],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_19',
    situation:
      'Началась суматоха, все паникуют и суетятся без дела. Какой пацанский приказ отдашь?',
    displayWords: [
      'Ша!',
      'Тишина в студии',
      'Осадите коней',
      'Без паники',
    ],
    validationKeywords: [
      'ша',
      'тишин',
      'студи',
      'осадит',
      'кон',
      'паник',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
  {
    id: 'fanya_20',
    situation:
      'Ты устал слушать пустые обещания человека. Как потребуешь от него реальных действий?',
    displayWords: [
      'За слова ответь',
      'Делом докажи',
      'Хватит базарить',
      'По факту давай',
    ],
    validationKeywords: [
      'слов',
      'ответ',
      'дел',
      'докаж',
      'хват',
      'базар',
      'факт',
      'давай',
    ],
    settings: { timeLimit: 30, goldThreshold: 15, minKeywords: 1 },
  },
]

export { jargonTasks }
