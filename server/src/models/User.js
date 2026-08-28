import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    // displayName — то, что видит пользователь в интерфейсе
    displayName: { type: String, trim: true },
    firstName: { type: String, trim: true }, // Имя
    lastName: { type: String, trim: true },
    avatar: { type: String, default: '' },
    // Email + Пароль (sparse позволяет не заполнять их для VK-пользователей)
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String },

    // Внешние ID (для будущего расширения)
    vkId: { type: String, unique: true, sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    // Способ авторизации (основной на момент регистрации)
    authProvider: {
      type: String,
      enum: ['local', 'vk', 'google'],
      default: 'local',
    },

    // Платформа, на которой аккаунт был создан
    registeredFrom: {
      type: String,
      enum: ['site', 'vk', 'android'],
      default: 'site',
    },
    // --- СЛУЖЕБНЫЕ ДАННЫЕ СОЦСЕТЕЙ ---
    // Храним оригинальные данные, чтобы юзер мог нажать "Сбросить аватар до ВК"
    socialProfilesData: {
      vk: {
        firstName: String,
        lastName: String,
        avatar: String,
      },
      google: {
        firstName: String,
        lastName: String,
        avatar: String,
      },
    },
    // Роли
    isAdmin: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    // --- ГЕЙМИФИКАЦИЯ (Прогресс) ---
    progression: {
      // уровень
      level: { type: Number, default: 1 },
      // игровой опыт текущего уроня
      xp: { type: Number, default: 0 },
      // баланс жетонов оратора
      coins: { type: Number, default: 0 },
      // Список полученных званий и наград
      achievements: [
        {
          title: { type: String }, // "Оратор 4 уровня", "Мастер споров"
          unlockedAt: { type: Date, default: Date.now },
          code: { type: String }, // "master_of_dispute" (удобно для логики иконок)
        },
      ],
    },
    // --- УДЕРЖАНИЕ (Retention) ---
    streak: {
      current: { type: Number, default: 0 },
      lastCompletedDate: { type: Date },
    },
    stats: {
      totalExercises: { type: Number, default: 0 },
      lifetimeXp: { type: Number, default: 0 }, // Глобальный счетчик опыта
      exerciseStats: [
        {
          alias: { type: String },
          title: { type: String },
          totalPoints: { type: Number, default: 0 },
          completionsCount: { type: Number, default: 0 },
        },
      ],
    },
    dailyProgress: [
      {
        taskId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'DailyTask',
        },
        currentValue: { type: Number, default: 0 }, // Сколько раз уже выполнил
        isCompleted: { type: Boolean, default: false },
        date: { type: String }, // Формат "YYYY-MM-DD" для быстрой проверки
      },
    ],
    weeklyXp: { type: Number, default: 0 },
    inventory: [
      {
        itemCode: { type: String },
        quantity: { type: Number, default: 1 },
        purchasedAt: { type: Date, default: Date.now },
        deliveryAddress: { type: String, default: '' }, // Хранит ФИО, телефон и адрес
        isShipped: { type: Boolean, default: false }, // Флаг: отправлен/выполнен ли заказ
      },
    ],
  },
  {
    timestamps: true, // Автоматически создаст createdAt и updatedAt
  },
)

// Позволяют MongoDB мгновенно находить ТОП-10 и считать ранг текущего юзера
userSchema.index({ 'stats.lifetimeXp': -1 })
userSchema.index({ weeklyXp: -1 })

const User = mongoose.model('User', userSchema)

export default User
