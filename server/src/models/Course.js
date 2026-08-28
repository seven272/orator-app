import mongoose from 'mongoose'

const CourseSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, unique: true }, // e.g., 'sales_master'
    title: { type: String, required: true },

    // Динамический массив 4-х шагов курса для рендеринга таймлайна на фронтенде
    blocks: [
      {
        blockType: {
          type: String,
          enum: ['theory', 'ai_workout', 'irl_challenge', 'exam'],
          required: true,
        },
        title: { type: String, required: true }, // Название шага (e.g., 'Теория', 'ИИ-воркаут')

        // Специфичные конфигурации валидации для каждого типа блока
        theoryConfig: {
          quiz: {
            correctAnswerIndex: { type: Number, required: true },
          },
        }, // 💡 ИСПРАВЛЕНО: закрыли theoryConfig

        aiWorkoutConfig: {
          // Список ID тренажёров из WORKOUT_CONFIGS на фронте (e.g., ['investor_pitch', 'objection_handler'])
          workoutConfigIds: [{ type: String, required: true }],
          requiredScore: { type: Number, default: 1000 }, // Глобальный накопительный порог баллов для всего блока
        }, // 💡 ИСПРАВЛЕНО: закрыли aiWorkoutConfig

        irlChallengeConfig: {
          description: { type: String, required: true }, // краткое описание сути челленджа
        }, // 💡 ИСПРАВЛЕНО: закрыли irlChallengeConfig

        examConfig: {
          minScoreToPass: { type: Number, default: 85 }, // Проходной балл для экзамена
        }, 
      }, 
    ], 

    // Награды за успешное прохождение всего курса
    rewards: {
      xp: { type: Number, default: 1000 },
      coins: { type: Number, default: 100 },
      achievementCode: { type: String, default: 'course_master' },
    },
  },
  { timestamps: true },
)

export default mongoose.model('Course', CourseSchema)
