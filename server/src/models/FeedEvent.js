import mongoose from 'mongoose'

const feedEventSchema = new mongoose.Schema(
  {
    // Ссылка на пользователя, который совершил действие
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Тип активности (для подбора иконок и логики шаблонов текста на фронте)
    type: {
      type: String,
      enum: [
        'RANK_UP',
        'CHALLENGE_DONE',
        'PREMIUM_BUY',
        'STREAK_WEEK',
        'EXERCISE_TOP_SCORE', // 🎙️ Высокий балл в ИИ-тренажере (>80)
        'EXERCISE_MILESTONE', // ⚡ Круглое число прохождений (кратное 5 или 10)
        'ACHIEVEMENT_UNLOCKED', // Для публикаций о новых ачивках
        'COURSE_STARTED', //Началло курса
        'COURSE_COMPLETED', //Завершение курса
        'SHOP_PURCHASE', // Покупка в магазине
      ],
      required: true,
    },

    // Метаданные события (динамические параметры для разных типов событий)
    meta: {
      eventTargetName: { type: String }, // Универсальное название (челленджа, курса, товара или ранга)
      newRank: { type: String }, // Новый ораторский ранг юзера
      streakDays: { type: Number }, // Количество дней ударного режима (ударный темп)
      exerciseTitle: { type: String }, // Название тренажера («Дебаты», «Ассоциации»)
      score: { type: Number }, // Полученный балл
      completionsCount: { type: Number }, // Какое по счету прохождение (5, 10, 15...)
    },

    // Массив ID пользователей, которые нажали кнопку "Поздравить / Огонь 🔥"
    // Храним ID, чтобы один и тот же пользователь не мог прожать реакцию дважды
    congratulatedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true, // Автоматически создаст поля createdAt и updatedAt
  },
)

// ⏳ Автоматическое самоочищение (TTL-индекс)
// Событие будет бесследно удаляться из базы через 7 дней (604800 секунд) после создания,
// так как старая лента теряет актуальность, а база данных не будет перегружаться.
feedEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 604800 },
)

// Индекс для быстрой выборки свежих событий комьюнити
feedEventSchema.index({ createdAt: -1 })

const FeedEvent = mongoose.model('FeedEvent', feedEventSchema)
export default FeedEvent
