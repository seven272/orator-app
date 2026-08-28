import mongoose from 'mongoose'

const challengeSchema = new mongoose.Schema(
  {
    // Уникальный текстовый идентификатор (например, "coffee-icebreaker", "voice-of-leader")
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    
    // Тип челленджа: 'in-app' (внутри приложения) или 'irl' (в реальном мире)
    category: { 
      type: String, 
      enum: ['in-app', 'irl'], 
      required: true 
    },

    // Какой навык развивает из нашей обновленной SKILLS_MAP
    targetSkill: { 
      type: String, 
      enum: ['Техника речи', 'Находчивость', 'Харизма и Юмор', 'Убедительность', 'Коммуникация'],
      required: true 
    },

    // 👁️ Метод контроля выполнения
    // 'ai_text_report' — ИИ проверяет текстовую рефлексию пользователя
    // 'ai_audio_ дневник' — ИИ транскрибирует и оценивает аудио-рассказ о задании
    // 'p2p_qr' — друг сканирует QR-код и подтверждает выполнение
    // 'auto' — для in-app (автоматически засчитывается при сдаче нужного упражнения)
    verificationType: {
      type: String,
      enum: ['ai_text_report', 'ai_audio_diary', 'p2p_qr', 'auto'],
      required: true
    },

    // Инструкция для пользователя: что именно нужно написать в отчете или сказать в аудио
    verificationInstruction: { type: String },

    // Условия для автоматических или in-app челленджей
    conditions: {
      exerciseAlias: { type: String }, // Какое упражнение пройти (например, 'fear-explosive')
      minScore: { type: Number, default: 0 }, // Минимальный балл от GigaChat
      targetCount: { type: Number, default: 1 } // Сколько раз нужно выполнить для успеха
    },

    // 🎁 Награды за прохождение
    reward: {
      xp: { type: Number, default: 0 },
      coins: { type: Number, default: 0 },
      achievementCode: { type: String } // Код уникального титула, если предусмотрен
    },

    // Время жизни челленджа (для сезонных/недельных ивентов)
    // Если null — челлендж постоянный (доступен всегда)
    expiresAt: { type: Date }
  },
  { timestamps: true }
)

// Индекс для быстрой фильтрации активных ивентов
challengeSchema.index({ category: 1, expiresAt: 1 })

const Challenge = mongoose.model('Challenge', challengeSchema)
export default Challenge
