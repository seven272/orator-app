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
        'debate',
        'interview',
        'icebreaker',
        'tribune',
        'alibi',
        'bargain',
        'knockout',
        'metaphor',
        'poem-tongue',
        'stop-word',
        'poem-acting',
        'poem-rap',
        'radio-host',
        'random-word',
        'historical-battle'
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
