import mongoose from 'mongoose'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()

const testUsers = [
  {
    displayName: 'Алексей Оратор',
    email: 'alex@test.com',
    isPremium: true,
    avatar: 'https://dicebear.com',
    progression: { level: 8, xp: 450, coins: 120 },
    streak: { current: 14 },
    weeklyXp: 850, 
    stats: {
      totalExercises: 45,
      lifetimeXp: 12450, // 🥇 1-е место в глобальном топе
      exerciseStats: [{ alias: 'ai-debate', title: 'Дебат-клуб', totalPoints: 4500, completionsCount: 15 }]
    }
  },
  {
    displayName: 'Анна Лингвист',
    email: 'anna@test.com',
    isPremium: true,
    avatar: 'https://dicebear.com',
    progression: { level: 7, xp: 120, coins: 140 },
    streak: { current: 9 },
    weeklyXp: 490,
    stats: {
      totalExercises: 32,
      lifetimeXp: 8900, // 🥈 2-е место в глобальном топе
      exerciseStats: [{ alias: 'tongue-twister', title: 'Битва дикции', totalPoints: 3100, completionsCount: 10 }]
    }
  },
  {
    displayName: 'Мария Дебаты',
    email: 'maria@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 6, xp: 200, coins: 50 },
    streak: { current: 5 },
    weeklyXp: 620,
    stats: {
      totalExercises: 24,
      lifetimeXp: 6150, // 🥉 3-е место в глобальном топе
      exerciseStats: [{ alias: 'joke-master', title: 'Импровизатор анекдотов', totalPoints: 2150, completionsCount: 8 }]
    }
  },
  {
    displayName: 'Дмитрий Сторителлер',
    email: 'dima@test.com',
    isPremium: false,
    avatar: 'dicebear.com', // Проверка фоллбэка на букву "Д" в UI
    progression: { level: 5, xp: 800, coins: 90 },
    streak: { current: 7 },
    weeklyXp: 510,
    stats: {
      totalExercises: 18,
      lifetimeXp: 4900,
      exerciseStats: [{ alias: 'association', title: 'Словесный мост', totalPoints: 1900, completionsCount: 5 }]
    }
  },
  {
    displayName: 'Елена Харизма',
    email: 'elena@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 5, xp: 310, coins: 40 },
    streak: { current: 3 },
    weeklyXp: 310,
    stats: {
      totalExercises: 15,
      lifetimeXp: 4200,
      exerciseStats: [{ alias: 'description', title: 'Ода предмету', totalPoints: 1200, completionsCount: 4 }]
    }
  },
  {
    displayName: 'Иван Ледокол',
    email: 'ivan@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 4, xp: 650, coins: 30 },
    streak: { current: 4 },
    weeklyXp: 450,
    stats: {
      totalExercises: 14,
      lifetimeXp: 4100,
      exerciseStats: [{ alias: 'logic-chain', title: 'Логическая цепь', totalPoints: 1100, completionsCount: 4 }]
    }
  },
  {
    displayName: 'Павел Риторика',
    email: 'pavel@test.com',
    isPremium: false,
    avatar: 'dicebear.com', // Проверка фоллбэка на букву "П"
    progression: { level: 4, xp: 150, coins: 15 },
    streak: { current: 2 },
    weeklyXp: 280,
    stats: {
      totalExercises: 11,
      lifetimeXp: 3100,
      exerciseStats: [{ alias: 'toast-master', title: 'Мастер тостов', totalPoints: 900, completionsCount: 3 }]
    }
  },
  {
    displayName: 'Ольга Публика',
    email: 'olga@test.com',
    isPremium: true,
    avatar: 'https://dicebear.com',
    progression: { level: 3, xp: 900, coins: 75 },
    streak: { current: 1 },
    weeklyXp: 210,
    stats: {
      totalExercises: 10,
      lifetimeXp: 2950,
      exerciseStats: [{ alias: 'ai-icebreaker', title: 'Ледокол', totalPoints: 750, completionsCount: 3 }]
    }
  },
  {
    displayName: 'Сергей Аргумент',
    email: 'sergey@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 3, xp: 420, coins: 20 },
    streak: { current: 6 },
    weeklyXp: 180,
    stats: {
      totalExercises: 9,
      lifetimeXp: 2650,
      exerciseStats: [{ alias: 'ai-debate', title: 'Дебат-клуб', totalPoints: 1200, completionsCount: 4 }]
    }
  },
  {
    displayName: 'Константин Спич',
    email: 'kostya@test.com',
    isPremium: false,
    avatar: 'dicebear.com', // Проверка фоллбэка на букву "К"
    progression: { level: 3, xp: 100, coins: 5 },
    streak: { current: 0 },
    weeklyXp: 90,
    stats: {
      totalExercises: 8,
      lifetimeXp: 2350,
      exerciseStats: [{ alias: 'taboo', title: 'Словесное табу', totalPoints: 1100, completionsCount: 3 }]
    }
  },
  {
    displayName: 'Наталья Слово',
    email: 'natasha@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 2, xp: 850, coins: 10 },
    streak: { current: 5 },
    weeklyXp: 150,
    stats: {
      totalExercises: 6,
      lifetimeXp: 2100,
      exerciseStats: [{ alias: 'fear-explosive', title: 'Громкий вызов', totalPoints: 600, completionsCount: 2 }]
    }
  },
  {
    displayName: 'Татьяна Тезис',
    email: 'tanya@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 2, xp: 300, coins: 0 },
    streak: { current: 2 },
    weeklyXp: 40,
    stats: {
      totalExercises: 5,
      lifetimeXp: 1900,
      exerciseStats: [{ alias: 'science-translator', title: 'Просто о сложном', totalPoints: 900, completionsCount: 3 }]
    }
  },
  {
    displayName: 'Владимир Новичок',
    email: 'vova@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 2, xp: 100, coins: 2 },
    streak: { current: 1 },
    weeklyXp: 110,
    stats: {
      totalExercises: 4,
      lifetimeXp: 1400,
      exerciseStats: [{ alias: 'king-failure', title: 'Король провала', totalPoints: 500, completionsCount: 2 }]
    }
  },
  {
    displayName: 'Михаил Экспромт',
    email: 'misha@test.com',
    isPremium: true,
    avatar: 'dicebear.com', // Проверка фоллбэка на букву "М"
    progression: { level: 1, xp: 750, coins: 8 },
    streak: { current: 3 },
    weeklyXp: 300,
    stats: {
      totalExercises: 3,
      lifetimeXp: 750,
      exerciseStats: [{ alias: 'synonyms', title: 'Синонимайзер', totalPoints: 750, completionsCount: 3 }]
    }
  },
  {
    displayName: 'Евгений Голос',
    email: 'zhenya@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 1, xp: 150, coins: 0 },
    streak: { current: 0 },
    weeklyXp: 150,
    stats: {
      totalExercises: 1,
      lifetimeXp: 150,
      exerciseStats: [{ alias: 'tongue-twister', title: 'Битва дикции', totalPoints: 150, completionsCount: 1 }]
    }
  },
   {
    displayName: 'Евгений Тест1',
    email: 'zhenya@test.com',
    isPremium: false,
    avatar: 'https://dicebear.com',
    progression: { level: 1, xp: 150, coins: 0 },
    streak: { current: 0 },
    weeklyXp: 150,
    stats: {
      totalExercises: 1,
      lifetimeXp: 150,
      exerciseStats: [{ alias: 'tongue-twister', title: 'Битва дикции', totalPoints: 150, completionsCount: 1 }]
    }
  }
]




const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    // Удаляем только старых тестовых пользователей, чтобы не затереть твоего админа
    await User.deleteMany({
      email: { $in: testUsers.map((u) => u.email) },
    })

    // Генерируем аватарки на основе имен
    const usersWithAvatars = testUsers.map((user) => ({
      ...user,
      password: 'hashed_password_123', // Заглушка
      avatar: `dicebear.com{encodeURIComponent(user.displayName)}`,
    }))

    await User.insertMany(usersWithAvatars)
    console.log(
      '✅ 15 тестовых пользователей успешно добавлены в базу данных!',
    )
    process.exit()
  } catch (err) {
    console.error('❌ Ошибка сидирования пользователей:', err)
    process.exit(1)
  }
}

seedUsers()
