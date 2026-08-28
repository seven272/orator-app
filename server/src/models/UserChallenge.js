import mongoose from 'mongoose'

const userChallengeSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    challengeId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Challenge', 
      required: true 
    },

    // Статус: 'active' (в процессе), 'pending_review' (на проверке у ИИ), 'completed' (успех), 'failed' (провален по времени)
    status: {
      type: String,
      enum: ['active', 'pending_review', 'completed', 'failed'],
      default: 'active'
    },

    // Текущий прогресс выполнения (актуально для составных задач, например 0 из 3)
    currentProgressValue: { type: Number, default: 0 },

    // Данные проверки, отправленные пользователем
    submissionData: {
      textReport: { type: String }, // Сюда пишется текст рефлексии для проверки ИИ
      audioUrl: { type: String },   // Ссылка на аудио-файл дневника
      p2pToken: { type: String }    // Уникальный токен для генерации QR-кода подтверждения
    },

    // Вердикт от GigaChat API
    aiFeedback: {
      score: { type: Number },      // Насколько ИИ поверил отчету (0-100)
      comment: { type: String }     // Развернутый комментарий-анализ от ИИ
    },

    completedAt: { type: Date }
  },
  { timestamps: true }
)

// Составной индекс: убережет от дублирования задач и ускорит поиск активных челленджей юзера
userChallengeSchema.index({ userId: 1, challengeId: 1 }, { unique: true })
userChallengeSchema.index({ userId: 1, status: 1 })

const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema)
export default UserChallenge
