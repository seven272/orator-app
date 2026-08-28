import mongoose from 'mongoose'

// Подсхема сообщений ИИ-диалога. Поле 'text' полностью совпадает с контроллерами реплик
const ChatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  text: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now }
})

// Подсхема текущей активной ИИ-сессии (Питча, возражений и т.д.)
const CurrentAiSessionSchema = new mongoose.Schema({
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  workoutConfigId: { type: String, default: null }, // Помнит тип текущего тренажёра
  exerciseData: { type: mongoose.Schema.Types.Mixed, default: {} }, 
  messages: [ChatMessageSchema], 
  createdAt: { type: Date, default: Date.now }
})

// Подсхема для хранения архивных прохождений курса в истории при перезапусках
const ArchiveRecordSchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['completed', 'failed'] },
    finishedAt: { type: Date, default: Date.now },
    blocksProgress: {
      theory: { isCompleted: Boolean },
      aiWorkout: {
        isCompleted: Boolean,
        accumulatedScore: Number,
        sessionsCount: Number,
      },
      irlChallenge: {
        isCompleted: Boolean,
        textReport: String,
        aiFeedback: String,
      },
      exam: {
        isCompleted: Boolean,
        bestScore: Number,
        attemptsCount: Number,
        aiFeedback: String,
      },
    },
  },
  { _id: true },
)

const UserCourseProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    courseCode: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed', 'failed'], default: 'active' },
    currentBlockIndex: { type: Number, default: 0 }, // 0: Теория, 1: ИИ, 2: IRL, 3: Экзамен
    
    blocksProgress: {
      // Блок 0: Теория
      theory: { 
        isCompleted: { type: Boolean, default: false } 
      },
      
      // Блок 1: ИИ-тренажёр (Сессионный накопительный режим)
      aiWorkout: {
        isCompleted: { type: Boolean, default: false },
        accumulatedScore: { type: Number, default: 0 }, 
        sessionsCount: { type: Number, default: 0 }, 
        currentSession: { type: CurrentAiSessionSchema, default: null } // Очищается при финализации
      },
      
      // Блок 2: Практика (IRL)
      irlChallenge: {
        isCompleted: { type: Boolean, default: false },
        textReport: { type: String, default: '' },
        aiFeedback: { type: String, default: '' },
      },
      
      // Блок 3: Финальный Экзамен
      exam: {
        isCompleted: { type: Boolean, default: false },
        bestScore: { type: Number, default: 0 },
        attemptsCount: { type: Number, default: 0 },
        lastAttemptScore: { type: Number, default: 0 },
        lockedUntil: { type: Date, default: null },
        aiFeedback: { type: String, default: '' },
      },
    },
    history: [ArchiveRecordSchema], // История архивных сессий
  },
  { timestamps: true },
)

// Уникальный индекс, чтобы у юзера была строго одна запись на один курс
UserCourseProgressSchema.index({ userId: 1, courseCode: 1 }, { unique: true })

export default mongoose.model('UserCourseProgress', UserCourseProgressSchema)
