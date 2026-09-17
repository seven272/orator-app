//LEVEL 1
import IconEx1 from '../images/card-icons/association.png'
import IconEx2 from '../images/card-icons/description.png'
import IconEx3 from '../images/card-icons/tongue-twister.png'
import IconEx4 from '../images/card-icons/synonyms.png'
import IconEx5 from '../images/card-icons/emotion.png'
import IconEx6 from '../images/card-icons/logic-chain.png'
//LEVEL 2
import IconEx7 from '../images/card-icons/jargon-task.png'
import IconEx8 from '../images/card-icons/speaking-thread.png'
import IconEx9 from '../images/card-icons/toast-master.png'
import IconEx10 from '../images/card-icons/joke-master.png'
import IconEx11 from '../images/card-icons/taboo.png'
import IconEx12 from '../images/card-icons/science-translator.png'
import IconEx13 from '../images/card-icons/fear-explosive.png'
import IconEx14 from '../images/card-icons/king-failure.png'
//LEVEL 3
import IconEx15 from '../images/card-icons/ai-debate.png'
import IconEx16 from '../images/card-icons/ai-inrerview.png'
import IconEx17 from '../images/card-icons/ai-icebreaker.png'
import IconEx18 from '../images/card-icons/ai-tribune.png'
import IconEx19 from '../images/card-icons/ai-alibi.png'
import IconEx20 from '../images/card-icons/ai-bargain.png'
import IconEx21 from '../images/card-icons/ai-knockout.png'
import IconEx22 from '../images/card-icons/ai-metaphor.png'
import IconEx23 from '../images/card-icons/ai-poem-tongue.png'
import IconEx24 from '../images/card-icons/ai-poem-acting.png'
import IconEx25 from '../images/card-icons/ai-poem-rap.png'
import IconEx26 from '../images/card-icons/ai-radio-host.png'
import IconEx27 from '../images/card-icons/ai-stop-word.png'
import IconEx28 from '../images/card-icons/ai-random-word.png'
import IconEx29 from '../images/card-icons/ai-historical-battle.png'


const All_EXERCISES = {
  level1: [
    {
      id: '1',
      alias: 'association',
      title: 'Словесный мост',
      description: 'Найди общее между двумя словами',
      reward: 30,
      icon: IconEx1,
      skill: 'Находчивость',
      minLevel: 0,
      premium: false,
    },
    {
      id: '2',
      alias: 'description',
      title: 'Ода предмету',
      description: 'Описывай предмет 30 секунд без пауз',
      reward: 30,
      icon: IconEx2,
      skill: 'Коммуникация',
      minLevel: 0,
      premium: false,
    },
    {
      id: '3',
      alias: 'tongue-twister',
      title: 'Битва дикции',
      description: 'Прочитай быстро и четко',
      reward: 30,
      icon: IconEx3,
      skill: 'Техника речи',
      minLevel: 0,
      premium: false,
    },
    {
      id: '4',
      alias: 'synonyms',
      title: 'Синонимайзер',
      description: 'Назови 5 синонимов к слову',
      reward: 30,
      icon: IconEx4,
      skill: 'Находчивость',
      minLevel: 0,
      premium: false,
    },
    {
      id: '5',
      alias: 'emotion',
      title: 'Эмоциональный окрас',
      description: 'Прочитай фразу с заданной эмоцией',
      reward: 30,
      icon: IconEx5,
      skill: 'Харизма и Юмор',
      minLevel: 0,
      premium: false,
    },
    {
      id: '6',
      alias: 'logic-chain',
      title: 'Логическая цепь',
      description: 'Продолжи фразу за 15 секунд',
      reward: 30,
      icon: IconEx6,
      skill: 'Убедительность',
      minLevel: 0,
      premium: false,
    },
  ],
  level2: [
    {
      id: '7',
      alias: 'jargon-task',
      title: 'Блатной базар',
      description: 'Ответь на провокацию испульзуя ключевые слова',
      reward: 50,
      icon: IconEx7,
      skill: 'Убедительность',
      minLevel: 2,
      premium: false,
    },
    {
      id: '8',
      alias: 'speaking-thread',
      title: 'Нить разговора',
      description: 'Свяжи два понятия и ответь на вопросы',
      reward: 50,
      icon: IconEx8,
      skill: 'Убедительность',
      minLevel: 2,
      premium: false,
    },
    {
      id: '9',
      alias: 'toast-master',
      title: 'Мастер тостов',
      description: 'Произнеси тост по заданной схеме',
      reward: 50,
      icon: IconEx9,
      skill: 'Харизма и Юмор',
      minLevel: 2,
      premium: false,
    },
    {
      id: '10',
      alias: 'joke-master',
      title: 'Импровизатор анекдотов',
      description: 'Придумай свою смешную концовку анекдота',
      reward: 50,
      icon: IconEx10,
      skill: 'Харизма и Юмор',
      minLevel: 2,
      premium: false,
    },
    {
      id: '11',
      alias: 'taboo',
      title: 'Словесное табу',
      description:
        'Расскажи про предмет или явление не используя ключевые слова',
      reward: 50,
      icon: IconEx11,
      skill: 'Находчивость',
      minLevel: 2,
      premium: false,
    },
    {
      id: '12',
      alias: 'science-translator',
      title: 'Просто о сложном',
      description: 'Опиши сложный термин максимально просто',
      reward: 50,
      icon: IconEx12,
      skill: 'Убедительность',
      minLevel: 2,
      premium: false,
    },
    {
      id: '13',
      alias: 'fear-explosive',
      title: 'Громкий вызов',
      description:
        'Победа над тихим голосом и страхом привлечь внимание',
      reward: 50,
      icon: IconEx13,
      skill: 'Техника речи',
      minLevel: 2,
      premium: false,
    },
    {
      id: '14',
      alias: 'king-failure',
      title: 'Король провала',
      description:
        'Учит не бояться фейлов и делать их частью своего триумфа',
      reward: 50,
      icon: IconEx14,
      skill: 'Харизма и Юмор',
      minLevel: 2,
      premium: false,
    },
  ],

  level3: [
    {
      id: '15',
      alias: 'ai-debate',
      title: 'Дебат-клуб',
      description: 'Жаркие дебаты и горячие споры с ИИ-оппонентом',
      reward: 100,
      icon: IconEx15,
      skill: 'Убедительность',
      minLevel: 1,
      premium: true,
    },
    {
      id: '16',
      alias: 'ai-interview',
      title: 'Неудобный вопрос',
      description:
        'Формат телеинтервью с острыми вопросами с ИИ в роли ведущего',
      reward: 100,
      icon: IconEx16,
      skill: 'Коммуникация',
      minLevel: 1,
      premium: true,
    },
    {
      id: '17',
      alias: 'ai-icebreaker',
      title: 'Ледокол',
      description: 'Разговори закрытого собеседника',
      reward: 100,
      icon: IconEx17,
      skill: 'Коммуникация',
      minLevel: 1,
      premium: true,
    },
    {
      id: '18',
      alias: 'ai-tribune',
      title: 'Трибуна',
      description: 'Выскажись по теме и получи анализ текста',
      reward: 100,
      icon: IconEx18,
      skill: 'убедительность',
      minLevel: 1,
      premium: true,
    },
    {
      id: '19',
      alias: 'ai-alibi',
      title: 'Железное алиби',
      description: 'Убеди прокурора в своей невиновности',
      reward: 100,
      icon: IconEx19,
      skill: 'убедительность',
      minLevel: 1,
      premium: true,
    },

    {
      id: '20',
      alias: 'ai-bargain',
      title: 'Торг уместен',
      description: 'Сбей цену у неуступчевого продавца',
      reward: 100,
      icon: IconEx20,
      skill: 'коммуникация',
      minLevel: 1,
      premium: true,
    },

    {
      id: '21',
      alias: 'ai-knockout',
      title: 'Остроумный нокаут',
      description: 'Не дай хейтеру испортить выступление',
      reward: 100,
      icon: IconEx21,
      skill: 'харизма и юмор',
      minLevel: 1,
      premium: true,
    },

    {
      id: '22',
      alias: 'ai-metaphor',
      title: 'Трудный переводчик',
      description: 'Объясни так, чтобы понял даже ребенок',
      reward: 100,
      icon: IconEx22,
      skill: 'находчивость',
      minLevel: 1,
      premium: true,
    },
    {
      id: '23',
      alias: 'ai-poem-tongue',
      title: 'Тяжелая дикция',
      description:
        'Прокачай артикуляцию и речевую опору на коварных текстах',
      reward: 100,
      icon: IconEx23,
      skill: 'техника речи',
      minLevel: 1,
      premium: true,
    },
    {
      id: '24',
      alias: 'ai-poem-acting',
      title: 'Мастер дубляжа',
      description:
        'Озвучивай известные стихи в самых неожиданных и безумных ролях',
      reward: 100,
      icon: IconEx24,
      skill: 'харизма и юмор',
      minLevel: 1,
      premium: true,
    },

    {
      id: '25',
      alias: 'ai-poem-rap',
      title: 'Рэп-манифест',
      description:
        'Преврати классическую поэзию в хип-хоп трек с жестким ритмом',
      reward: 100,
      icon: IconEx25,
      skill: 'техника речи',
      minLevel: 1,
      premium: true,
    },

    {
      id: '26',
      alias: 'ai-radio-host',
      title: 'Радиоведущий',
      description:
        'Проведи прямой эфир утреннего шоу без единой секунды молчания',
      reward: 100,
      icon: IconEx26,
      skill: 'техника речи',
      minLevel: 1,
      premium: true,
    },
    {
      id: '27',
      alias: 'ai-stop-word',
      title: 'Анти-слова',
      description:
        'Попробуй красочно описать ситуацию, обходя хитрые табу и стоп-слова',
      reward: 100,
      icon: IconEx27,
      skill: 'находчивость',
      minLevel: 1,
      premium: true,
    },

    {
      id: '28',
      alias: 'ai-random-word',
      title: 'Слово из шляпы',
      description:
        'Выдай спич на заданную тему, вплетая в него случайный предмет',
      reward: 100,
      icon: IconEx28,
      skill: 'находчивость',
      minLevel: 1,
      premium: true,
    },
    {
      id: '29',
      alias: 'ai-historical-battle',
      title: 'Эхо Истории',
      description:
        'Примерить на себя приемы великих ораторов в бытовых ситуациях',
      reward: 100,
      icon: IconEx29,
      skill: 'убедительность',
      minLevel: 1,
      premium: true,
    },
  ],
}

export { All_EXERCISES }
