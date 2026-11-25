import mongoose from 'mongoose'

const rankExamSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    examAlias: {
      type: String,
      required: true,
      enum: ['exam-confident', 'exam-pro', 'exam-master', 'exam-legend'],
    },
    targetRank: {
      type: Number,
      required: true, // 1, 2, 3 или 4
    },
    // Сгенерированный билет (тема, контекст, обязательные слова/метафора и т.д.)
    ticketData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Распознанный монолог пользователя
    userSpeech: {
      type: String,
      default: '',
    },
    score: {
      type: Number,
      default: null,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'interrupted'],
      default: 'active',
    },
    result: {
      totalScore: Number,
      feedback: String,
      criteria: {
        type: Map,
        of: Number,
      },
    },
  },
  { timestamps: true },
)

rankExamSessionSchema.index({ userId: 1, examAlias: 1, status: 1 })

const RankExamSession = mongoose.model(
  'RankExamSession',
  rankExamSessionSchema,
)

export default RankExamSession
