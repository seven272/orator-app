import rank1Img from '../assets/images/ranks/rank-1.png'
import rank2Img from '../assets/images/ranks/rank-2.png'
import rank3Img from '../assets/images/ranks/rank-3.png'
import rank4Img from '../assets/images/ranks/rank-4.png'
import rank5Img from '../assets/images/ranks/rank-5.png'

const RANKS = [
  {
    rankIndex: 0,
    title: 'Начинающий',
    minXp: 0,
    icon: rank1Img,
    audience: 'Кухня (Семья и кот, 1–3 чел)',
    desc: 'Тестирую навыки на самых близких.',
    nextRankRequirements: {
      targetRank: 1,
      requiredXp: 10000,
      exercises: [
        {
          alias: 'ai-rhythm-transformer',
          title: 'ИИ-метроном',
          minScore: 70,
        },
        {
          alias: 'ai-random-word',
          title: 'Слово из шляпы',
          minScore: 70,
        },
      ],
      exam: {
        alias: 'exam-confident',
        title: 'Экзамен: Первая сцена',
        description:
          'Презентуйте случайный продукт за 60 секунд по четкой структуре: проблема, решение, выгода и призыв к действию.',
        minScore: 70,
      },
      realWorldTask: {
        title: 'Голосовое без черновиков',
        description:
          'Запишите другу или коллеге голосовое сообщение от 1.5 минут с четкой мыслью, не перезаписывая его. Опишите в отчете, кому отправляли, какую мысль доносили и как отреагировал собеседник.',
      },
    },
  },
  {
    rankIndex: 1,
    title: 'Уверенный',
    minXp: 10000,
    icon: rank2Img,
    audience: 'Офис / Локальный бар (15–30 чел)',
    desc: 'Внимательно слушают в компании.',
    nextRankRequirements: {
      targetRank: 2,
      requiredXp: 50000,
      exercises: [
        {
          alias: 'ai-debate',
          title: 'Дебаты',
          minScore: 75,
        },
        {
          alias: 'ai-poem-acting',
          title: 'Мастер дубляжа',
          minScore: 75,
        },
        {
          alias: 'ai-toast-critic',
          title: 'Банкетный критик',
          minScore: 75,
        },
      ],
      exam: {
        alias: 'exam-pro',
        title: 'Экзамен: Адвокат идеи',
        description:
          'Защитите спорный тезис в убедительном монологе: приведите сильные аргументы и заранее закройте главное возражение.',
        minScore: 75,
      },
      realWorldTask: {
        title: 'Тост или поздравление вживую',
        description:
          'Произнесите структурированный тост или поздравительную речь в компании от 3 человек. Напишите в отчете, как вы построили вступление и кульминацию и какой была реакция аудитории.',
      },
    },
  },
  {
    rankIndex: 2,
    title: 'Профи',
    minXp: 50000,
    icon: rank3Img,
    audience: 'Конференц-зал TED (200–500 чел)',
    desc: 'Держу фокус целого зала.',
    nextRankRequirements: {
      targetRank: 3,
      requiredXp: 100000,
      exercises: [
        {
          alias: 'ai-interview',
          title: 'Стресс-интервью',
          minScore: 75,
        },
        {
          alias: 'ai-poem-tongue',
          title: 'Тяжелая дикция',
          minScore: 75,
        },
        {
          alias: 'ai-tribune',
          title: 'Трибуна',
          minScore: 75,
        },
      ],
      exam: {
        alias: 'exam-master',
        title: 'Экзамен: Антикризисное обращение',
        description:
          'Выступите перед недовольной аудиторией в острой ситуации, сохранив спокойствие и органично вплетя 3 обязательных факта.',
        minScore: 75,
      },
      realWorldTask: {
        title: 'Публичный вопрос или выступление на созвоне',
        description:
          'Задайте развернутый вопрос спикеру на митапе/вебинаре или проведите мини-презентацию на рабочем созвоне. Опишите контекст, вашу формулировку и результат.',
      },
    },
  },
  {
    rankIndex: 3,
    title: 'Мастер',
    minXp: 100000,
    icon: rank4Img,
    audience: 'Концерт-холл (3 000 – 5 000 чел)',
    desc: 'Вдохновляю тысячи сердец.',
    nextRankRequirements: {
      targetRank: 4,
      requiredXp: 200000,
      exercises: [
        {
          alias: 'ai-commercial-pitch',
          title: 'Инвестор Эдуард',
          minScore: 80,
        },
        {
          alias: 'ai-association-master',
          title: 'Мост смыслов',
          minScore: 80,
        },
        {
          alias: 'ai-radio-host',
          title: 'Радиоведущий',
          minScore: 80,
        },
        {
          alias: 'ai-bargain',
          title: 'Торг уместен',
          minScore: 80,
        },
          {
          alias: 'ai-nesmeyana',
          title: 'Несмеяна',
          minScore: 80,
        },
      ],
      exam: {
        alias: 'exam-legend',
        title: 'Экзамен: Главная сцена',
         description:
          'Произнесите вдохновляющую речь уровня TED: объедините историю-крючок, сквозную метафору и сильный манифест.',
        minScore: 85,
      },
      realWorldTask: {
        title: 'Живое выступление перед аудиторией',
        description:
          'Выступите вживую на митапе, конференции, открытом микрофоне или проведите живой мастер-класс/лекцию. Подробно опишите тему, аудиторию и главные выводы.',
      },
    },
  },
  {
    rankIndex: 4,
    title: 'Легенда',
    minXp: 200000,
    icon: rank5Img,
    audience: 'Стадион «Олимпийский» (30 000+)',
    desc: 'Голос, меняющий стадионы!',
    nextRankRequirements: null,
  },
]

// Для обратной совместимости с твоим старым RANGS_MAP (если используется где-то еще)
const RANKS_MAP = RANKS.reduce((acc, item) => {
  acc[item.rankIndex] = item.title
  return acc
}, {})

export { RANKS_MAP, RANKS }
