const SKILLS_MAP = {
  'техника речи': [
    'tongue-twister', // Битва дикции
    'fear-explosive', // Громкий вызов (громкость голоса)
    'ai-poem-tongue', // Тяжелая дикция
    'ai-poem-rap', //Рэп-манифест
    'ai-radio-host', //Радиоведущий
  ],
  находчивость: [
    'association', // Словесный мост (поиск связей)
    'synonyms', // Синонимайзер (богатство языка)
    'description', // Ода предмету (безостановочная речь)
    'taboo', // Словесное табу (обход запретных слов)
    'ai-metaphor', // Трудный переводчик
    'ai-stop-word', //Анти-слова
    'ai-random-word', //Слово из шляпы
  ],
  'харизма и юмор': [
    'emotion', // Эмоциональный окрас
    'joke-master', // Импровизатор анекдотов (юмор)
    'toast-master', // Мастер тостов
    'king-failure', // Король провала (самоирония, уверенность)
    'ai-knockout', // Остроумный нокаут
    'ai-poem-acting', //Мастер дубляжа
  ],
  убедительность: [
    'logic-chain', // Логическая цепь
    'speaking-thread', // Нить разговора
    'jargon-task', // Блатной базар (ответ на провокации)
    'science-translator', // Просто о сложном
    'ai-debate', // Дебат-клуб (с ИИ)
    'ai-tribune', // Трибуна
    'ai-alibi', // Железное алиби
    'ai-hisai-historical-battle', //Эхо истории
  ],
  коммуникация: [
    'ai-icebreaker', // Ледокол (умение завязать разговор)
    'ai-interview', // Неудобный вопрос (ответы интервьюеру)
    'description', // Ода предмету (базовый навык монолога)
    'ai-bagrain', // Торг уместен
    'live-duel', // Живое общение, живая дуэль
  ],
}

const EXERCISE_MAX_POINTS = {
  // Упражнения уровня 1
  'tongue-twister': 30,
  association: 30,
  synonyms: 30,
  description: 30,
  emotion: 30,
  'logic-chain': 30,
  // Упражнения уровня 2
  'jargon-task': 50,
  'science-translator': 50,
  'joke-master': 50,
  'toast-master': 50,
  taboo: 50,
  'fear-explosive': 50,
  'king-failure': 50,
  'speaking-thread': 50,
  // Упражнения уровня 3 с ИИ (макс. 100)
  'ai-poem-tongue': 100,
  'ai-poem-rap': 100,
  'ai-radio-host': 100,
  'ai-metaphor': 100,
  'ai-stop-word': 100,
  'ai-random-word': 100,
  'ai-knockout': 100,
  'ai-poem-acting': 100,
  'ai-debate': 100,
  'ai-tribune': 100,
  'ai-alibi': 100,
  'ai-icebreaker': 100,
  'ai-interview': 100,
  'ai-bagrain': 100,
  //  Живые дуэли (макс. 150)
  'live-duel': 150,
}

export { SKILLS_MAP, EXERCISE_MAX_POINTS }
