import mongoose from 'mongoose'

const aiExercisesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Тип тренажера: 'debate', 'pitch', 'interview'
    exerciseType: {
      type: String,
      required: true,
      enum: [
        'ai-debate',
        'ai-interview',
        'ai-icebreaker',
        'ai-tribune',
        'ai-alibi',
        'ai-bargain', 
        'ai-knockout',
        'ai-metaphor',
        'ai-poem-tongue',
        'ai-stop-word',
        'ai-poem-acting',
        'ai-poem-rap',
        'ai-radio-host',
        'ai-random-word',
        'ai-historical-battle'
      ],
    },

    exerciseData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    score: {
      type: Number,
      default: null,
    },

    status: {
      type: String,
      enum: ['active', 'completed', 'interrupted'],
      default: 'active',
    },

    // Гибкий объект для результатов
    result: {
      totalScore: Number,
      feedback: String,
      // Специфичные критерии через Map (логика, харизма и т.д.)
      criteria: {
        type: Map,
        of: Number,
      },
    },
  },
  { timestamps: true },
)

// Экспортируем модель
const AiExercise = mongoose.model('AiExercise', aiExercisesSchema)

export default AiExercise
