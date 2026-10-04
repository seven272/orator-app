const All_EXERCISES = {
  level1: [
    {
      id: 'lev1-1',
      alias: 'association',
      title: 'Словесный мост',
      description: 'Найди общее между двумя словами',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-2',
      alias: 'description',
      title: 'Ода предмету',
      description: 'Описывай предмет 30 секунд без пауз',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-3',
      alias: 'tongue-twister',
      title: 'Битва дикции',
      description: 'Прочитай быстро и четко',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-4',
      alias: 'synonyms',
      title: 'Синонимайзер',
      description: 'Назови 5 синонимов к слову',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-5',
      alias: 'emotion',
      title: 'Эмоциональный окрас',
      description: 'Прочитай фразу с заданной эмоцией',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-6',
      alias: 'logic-chain',
      title: 'Логическая цепь',
      description: 'Продолжи фразу за 15 секунд',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-7',
      alias: 'word-zoom',
      title: 'Словесный зум',
      description:
        'Сузь абстрактное понятие до предмета на заданную букву',
      reward: 30,
      level: 1,
    },
    {
      id: 'lev1-8',
      alias: 'speech-pace',
      title: 'Метроном',
      description:
        'Читай текст, подстраиваясь под меняющийся темп метронома',
      reward: 30,
      level: 1,
    },
  ],
  level2: [
    {
      id: 'lev2-1',
      alias: 'jargon-task',
      title: 'Блатной базар',
      description: 'Ответь на провокацию испульзуя ключевые слова',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-2',
      alias: 'speaking-thread',
      title: 'Нить разговора',
      description: 'Свяжи два понятия и ответь на вопросы',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-3',
      alias: 'toast-master',
      title: 'Мастер тостов',
      description: 'Произнеси тост по заданной схеме',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-4',
      alias: 'joke-master',
      title: 'Импровизатор анекдотов',
      description: 'Придумай свою смешную концовку анекдота',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-5',
      alias: 'taboo',
      title: 'Словесное табу',
      description:
        'Расскажи про предмет или явление не используя ключевые слова',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-6',
      alias: 'science-translator',
      title: 'Просто о сложном',
      description: 'Опиши сложный термин максимально просто',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-7',
      alias: 'fear-explosive',
      title: 'Громкий вызов',
      description:
        'Победа над тихим голосом и страхом привлечь внимание',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-8',
      alias: 'king-failure',
      title: 'Король провала',
      description:
        'Учит не бояться фейлов и делать их частью своего триумфа',
      reward: 50,
      level: 2,
    },
    {
      id: 'lev2-9',
      alias: 'argument-speed',
      title: 'Пулемет аргументов',
      description:
        'Выдай максимальное количество аргументов за ограниченное время',
      reward: 50,
      level: 2,
    },
  ],

  level3: [
    {
      id: 'lev3-1',
      alias: 'ai-debate',
      title: 'Дебат-клуб',
      description: 'Жаркие дебаты и горячие споры с ИИ-оппонентом',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-2',
      alias: 'ai-inrerview',
      title: 'Неудобный вопрос',
      description:
        'Формат телеинтервью с острыми вопросами с ИИ в роли ведущего',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-3',
      alias: 'ai-icebreaker',
      title: 'Ледокол',
      description: 'Разговори закрытого собеседника',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-4',
      alias: 'ai-tribune',
      title: 'Трибуна',
      description: 'Выскажись по теме и получи анализ текста',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-5',
      alias: 'ai-alibi',
      title: 'Железное алиби',
      description: 'Убеди прокурора в своей невиновности',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-6',
      alias: 'ai-bargain',
      title: 'Торг уместен',
      description: 'Сбей цену у неуступчевого продавца',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-7',
      alias: 'ai-knockout',
      title: 'Остроумный нокаут',
      description: 'Не дай хейтеру испортить выступление',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-8',
      alias: 'ai-metaphor',
      title: 'Трудный переводчик',
      description: 'Объясни так, чтобы понял даже ребенок',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-9',
      alias: 'ai-poem-tongue',
      title: 'Тяжелая дикция',
      description:
        'Прокачай артикуляцию и речевую опору на коварных текстах',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-10',
      alias: 'ai-poem-acting',
      title: 'Мастер дубляжа',
      description:
        'Озвучивай известные стихи в самых неожиданных и безумных ролях',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-11',
      alias: 'ai-poem-rap',
      title: 'Рэп-манифест',
      description:
        'Преврати классическую поэзию в хип-хоп трек с жестким ритмом',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-12',
      alias: 'ai-radio-host',
      title: 'Радиоведущий',
      description:
        'Проведи прямой эфир утреннего шоу без единой секунды молчания',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-13',
      alias: 'ai-stop-word',
      title: 'Анти-слова',
      description:
        'Попробуй красочно описать ситуацию, обходя хитрые табу и стоп-слова',
      reward: 100,
      level: 3,
    },

    {
      id: 'lev3-14',
      alias: 'ai-random-word',
      title: 'Слово из шляпы',
      description:
        'Выдай спич на заданную тему, вплетая в него случайный предмет',
      reward: 100,
      level: 3,
    },
    {
      id: 'lev3-15',
      alias: 'ai-historical-battle',
      title: 'Эхо Истории',
      description:
        'Примерить на себя приемы великих ораторов в бытовых ситуациях',
      reward: 100,
      level: 3,
    },
  ],
}

export { All_EXERCISES }
