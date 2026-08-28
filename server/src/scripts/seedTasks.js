import mongoose from 'mongoose'
import Task from '../models/Task.js'
import dotenv from 'dotenv'

dotenv.config()


const ALL_EXERCISES = [
  // LEVEL 1 
  {
    alias: 'association',
    title: 'Словесный мост',
    description: 'Найди общее между двумя словами',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'находчивость',
  },
  {
    alias: 'description',
    title: 'Ода предмету',
    description: 'Описывай предмет 30 секунд без пауз',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'коммуникация',
  },
  {
    alias: 'tongue-twister',
    title: 'Битва дикции',
    description: 'Прочитай быстро и четко',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'техника речи',
  },
  {
    alias: 'synonyms',
    title: 'Синонимайзер',
    description: 'Назови 5 синонимов к слову',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'находчивость',
  },
  {
    alias: 'emotion',
    title: 'Эмоциональный окрас',
    description: 'Прочитай фразу с заданной эмоцией',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'харизма и юмор',
  },
  {
    alias: 'logic-chain',
    title: 'Логическая цепь',
    description: 'Продолжи фразу за 15 секунд',
    reward: 30,
    level: 1,
    premium: false,
    skill: 'убедительность',
  },

  // LEVEL 2
  {
    alias: 'jargon-task',
    title: 'Блатной базар',
    description: 'Ответь на провокацию используя ключевые слова',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'убедительность',
  },
  {
    alias: 'speaking-thread',
    title: 'Нить разговора',
    description: 'Свяжи два понятия и ответь на вопросы',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'убедительность',
  },
  {
    alias: 'toast-master',
    title: 'Мастер тостов',
    description: 'Произнеси тост по заданной схеме',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'харизма и юмор',
  },
  {
    alias: 'joke-master',
    title: 'Импровизатор анекдотов',
    description: 'Придумай свою смешную концовку анекдота',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'харизма и юмор',
  },
  {
    alias: 'taboo',
    title: 'Словесное табу',
    description: 'Расскажи про предмет не используя ключевые слова',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'находчивость',
  },
  {
    alias: 'science-translator',
    title: 'Просто о сложном',
    description: 'Опиши сложный термин максимально просто',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'убедительность',
  },
  {
    alias: 'fear-explosive',
    title: 'Громкий вызов',
    description: 'Победа над тихим голосом и страхом',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'техника речи',
  },
  {
    alias: 'king-failure',
    title: 'Король провала',
    description: 'Учит не бояться фейлов',
    reward: 50,
    level: 2,
    premium: false,
    skill: 'харизма и юмор',
  },

  // LEVEL 3 (AI)
  {
    alias: 'ai-debate',
    title: 'Дебат-клуб',
    description: 'Жаркие дебаты с ИИ-оппонентом',
    reward: 100,
    level: 3,
    premium: true,
    skill: 'убедительность',
  },
  {
    alias: 'ai-interview',
    title: 'Неудобный вопрос',
    description: 'Формат телеинтервью с острыми вопросами',
    reward: 100,
    level: 3,
    premium: true,
    skill: 'коммуникация',
  },
  {
    alias: 'ai-icebreaker',
    title: 'Ледокол',
    description: 'Разговори закрытого собеседника с ИИ',
    reward: 100,
    level: 3,
    premium: true,
    skill: 'коммуникация',
  },
  {
    alias: 'ai-tribune',
    title: 'Трибуна',
    description: 'Выскажись по теме и получи анализ ИИ',
    reward: 100,
    level: 3,
    premium: true,
    skill: 'убедительность',
  },
]

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    await Task.deleteMany({})
    await Task.insertMany(ALL_EXERCISES)
    console.log(
      '✅ База успешно обновлена упражнениями всех 3-х уровней!',
    )
    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

seedDB()
