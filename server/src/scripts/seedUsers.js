import mongoose from 'mongoose'
import User from '../models/User.js'
import dotenv from 'dotenv'

dotenv.config()


const testUsers = [
  {
    displayName: 'Алексей#8412', // 🔄 50%: Системный никнейм (Имя#ID)
    email: 'alexey@test.ru',
    isPremium: true,
    avatar: 'https://img.magnific.com/free-photo/funny-image-with-dog_23-2151179419.jpg?semt=ais_hybrid&w=740&q=80',
    progression: { level: 8, xp: 450, coins: 120 },
    streak: { current: 14 },
    weeklyXp: 850,
    stats: {
      totalExercises: 45,
      lifetimeXp: 12450, // 🥇 1-е место в глобальном топе
      exerciseStats: [
        {
          alias: 'ai-debate',
          title: 'Дебат-клуб',
          totalPoints: 4500,
          completionsCount: 15,
        },
      ],
    },
  },
  {
    displayName: 'krasava_99', // 🔄 50%: Самописный/придуманный никнейм
    email: 'krasava@test.ru',
    isPremium: true,
    avatar: '', // 🖼️ Действующий аватар
    progression: { level: 7, xp: 120, coins: 140 },
    streak: { current: 9 },
    weeklyXp: 490,
    stats: {
      totalExercises: 32,
      lifetimeXp: 8900, // 🥈 2-е место в глобальном топе
      exerciseStats: [
        {
          alias: 'tongue-twister',
          title: 'Битва дикции',
          totalPoints: 3100,
          completionsCount: 10,
        },
      ],
    },
  },
  {
    displayName: 'Анна#2045', // Системный никнейм
    email: 'anna@test.ru',
    isPremium: false,
    avatar: 'https://esx.esxscloud.com/liveme/poster/540x540/b06904f3f32d3dff17ff2d2b76753d8e_icon.jpeg', // 🖼️ Действующий аватар
    progression: { level: 6, xp: 200, coins: 50 },
    streak: { current: 5 },
    weeklyXp: 620,
    stats: {
      totalExercises: 24,
      lifetimeXp: 6150, // 🥉 3-е место в глобальном топе
      exerciseStats: [
        {
          alias: 'joke-master',
          title: 'Импровизатор анекдотов',
          totalPoints: 2150,
          completionsCount: 8,
        },
      ],
    },
  },
  {
    displayName: 'Troll_Rhetoric', // Самописный никнейм
    email: 'troll@test.ru',
    isPremium: false,
    avatar: '',
    progression: { level: 5, xp: 310, coins: 80 },
    streak: { current: 7 },
    weeklyXp: 410,
    stats: {
      totalExercises: 19,
      lifetimeXp: 4900, // 4-е место
      exerciseStats: [
        {
          alias: 'ai-debate',
          title: 'Дебат-клуб',
          totalPoints: 1800,
          completionsCount: 6,
        },
      ],
    },
  },
  {
    displayName: 'Дмитрий#5011', // Системный никнейм
    email: 'dmitry@test.ru',
    isPremium: true,
    avatar: '',
    progression: { level: 5, xp: 90, coins: 95 },
    streak: { current: 4 },
    weeklyXp: 380,
    stats: {
      totalExercises: 16,
      lifetimeXp: 4200, // 5-е место
      exerciseStats: [
        {
          alias: 'joke-master',
          title: 'Импровизатор анекдотов',
          totalPoints: 1200,
          completionsCount: 4,
        },
      ],
    },
  },
  {
    displayName: 'Speaker_Pro', // Самописный никнейм
    email: 'speakerpro@test.ru',
    isPremium: false,
    avatar: '',
    progression: { level: 4, xp: 410, coins: 30 },
    streak: { current: 3 },
    weeklyXp: 310,
    stats: {
      totalExercises: 12,
      lifetimeXp: 3150, // 6-е место
      exerciseStats: [
        {
          alias: 'tongue-twister',
          title: 'Битва дикции',
          totalPoints: 950,
          completionsCount: 3,
        },
      ],
    },
  },
  {
    displayName: 'Мария#1094', // Системный никнейм
    email: 'maria@test.ru',
    isPremium: false,
    avatar: 'https://i.pinimg.com/originals/2d/1f/25/2d1f25dc103b92b2d85e89a648df0ea9.jpg?nii=t',
    progression: { level: 4, xp: 150, coins: 40 },
    streak: { current: 0 },
    weeklyXp: 210,
    stats: {
      totalExercises: 10,
      lifetimeXp: 2800, // 7-е место
      exerciseStats: [
        {
          alias: 'ai-debate',
          title: 'Дебат-клуб',
          totalPoints: 800,
          completionsCount: 3,
        },
      ],
    },
  },
  {
    displayName: 'Cyber_Cicero', // Самописный никнейм
    email: 'cicero@test.ru',
    isPremium: false,
    avatar: 'https://masterpiecer-images.s3.yandex.net/5fb1f4a85c165ea:upscaled',
    progression: { level: 3, xp: 220, coins: 20 },
    streak: { current: 2 },
    weeklyXp: 180,
    stats: {
      totalExercises: 7,
      lifetimeXp: 1950, // 8-е место
      exerciseStats: [
        {
          alias: 'joke-master',
          title: 'Импровизатор анекдотов',
          totalPoints: 600,
          completionsCount: 2,
        },
      ],
    },
  },
  {
    displayName: 'Елена#3372', // Системный никнейм
    email: 'elena@test.ru',
    isPremium: false,
    avatar: '',
    progression: { level: 2, xp: 80, coins: 15 },
    streak: { current: 1 },
    weeklyXp: 120,
    stats: {
      totalExercises: 4,
      lifetimeXp: 1100, // 9-е место
      exerciseStats: [
        {
          alias: 'tongue-twister',
          title: 'Битва дикции',
          totalPoints: 300,
          completionsCount: 1,
        },
      ],
    },
  },
  {
    displayName: 'Veni_Vidi_Vici', // Самописный никнейм
    email: 'vvv@test.ru',
    isPremium: false,
    avatar: '',
    progression: { level: 1, xp: 40, coins: 5 },
    streak: { current: 1 },
    weeklyXp: 40,
    stats: {
      totalExercises: 2,
      lifetimeXp: 440, // 10-е место
      exerciseStats: [
        {
          alias: 'ai-debate',
          title: 'Дебат-клуб',
          totalPoints: 150,
          completionsCount: 1,
        },
      ],
    },
  },
]

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)

    // Удаляем только старых тестовых пользователей, чтобы не затереть твоего админа
    await User.deleteMany({
      email: { $in: testUsers.map((u) => u.email) },
    })

    // Генерируем пароль
    const usersPassword = testUsers.map((user) => ({
      ...user,
      password: 'hashed_password_123', // Заглушка
    }))

    await User.insertMany(usersPassword)
    console.log(
      `✅ ${testUsers.length} тестовых пользователей успешно добавлены в базу данных!`,
    )
    process.exit()
  } catch (err) {
    console.error('❌ Ошибка сидирования пользователей:', err)
    process.exit(1)
  }
}

seedUsers()
