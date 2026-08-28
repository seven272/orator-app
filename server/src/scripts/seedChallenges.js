import mongoose from 'mongoose'
import Challenge from '../models/Challenge.js'
import dotenv from 'dotenv'

dotenv.config()

const irlChallenges = [
  {
    code: 'irl-coffee-icebreaker',
    title: 'Кофейный ледокол',
    description: 'Сделай искренний, нестандартный комплимент бариста или кассиру при покупке напитка и удержи легкий диалог на 30 секунд.',
    category: 'irl',
    targetSkill: 'Коммуникация',
    verificationType: 'ai_text_report',
    verificationInstruction: 'Напиши короткий отчет: какой комплимент ты сделал и как отреагировал человек?',
    reward: { xp: 150, coins: 15 }
  },
  {
    code: 'irl-voice-leader',
    title: 'Голос лидера',
    description: 'Проведи важный созвон или встречу, сознательно говоря на 20% медленнее и на полтона ниже обычного. Заменяй паузы-паразиты («эээ», «ну») секундным молчанием.',
    category: 'irl',
    targetSkill: 'Техника речи',
    verificationType: 'ai_text_report',
    verificationInstruction: 'Напиши отчет: удалось ли удержать низкий темп и как это повлияло на уверенность?',
    reward: { xp: 200, coins: 20 }
  },
  {
    code: 'irl-advocate-devil',
    title: 'Адвокат дьявола',
    description: 'В дружеском споре, где все критикуют какое-то бытовое явление (погоду, фильм, новость), встань на его защиту и приведи 3 неожиданных плюса.',
    category: 'irl',
    targetSkill: 'Находчивость',
    verificationType: 'ai_text_report',
    verificationInstruction: 'Напиши отчет: какое явление ты защищал и какие аргументы привел?',
    reward: { xp: 250, coins: 25 }
  },
  {
    code: 'irl-toast-master',
    title: 'Режиссер тостов',
    description: 'На ближайшем семейном ужине или встрече с друзьями скажи тост первым, используя структуру: Завязка ➔ Самоирония ➔ Главный вывод.',
    category: 'irl',
    targetSkill: 'Харизма и Юмор',
    verificationType: 'ai_text_report',
    verificationInstruction: 'Напиши отчет: как отреагировали слушатели и получилось ли вызвать улыбку?',
    reward: { xp: 300, coins: 30 }
  },
  {
    code: 'irl-action-now',
    title: 'Финальный аккорд',
    description: 'На рабочем совещании или созвоне возьми слово в самом конце, лаконично (до 1 минуты) подведи итог встречи и предложи четкое следующее действие.',
    category: 'irl',
    targetSkill: 'Убедительность',
    verificationType: 'ai_text_report',
    verificationInstruction: 'Напиши отчет: какую ключевую мысль ты зафиксировал для команды?',
    reward: { xp: 350, coins: 35 }
  }
];

// Команда для сидинга в вашем скрипте:
// await Challenge.insertMany(irlChallenges);




const seedChallenges = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    // Удаляем только старых тестовых пользователей, чтобы не затереть твоего админа
    await Challenge.deleteMany({
      email: { $in: irlChallenges.map((u) => u.code) },
    })

   
    await Challenge.insertMany(irlChallenges)
    console.log(
      '✅ Челленджи успешно добавлены в базу данных!',
    )
    process.exit()
  } catch (err) {
    console.error('❌ Ошибка сидирования челенджей:', err)
    process.exit(1)
  }
}

seedChallenges()
