import mongoose from 'mongoose'

const KnowledgeItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['article', 'video'],
      default: 'article',
      required: true,
    },
    summary: {
      type: String,
      default: '',
      trim: true,
    },
    contentMarkdown: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    // Данные для видеоразборов (если type === 'video')
    video: {
      platform: {
        type: String,
        enum: ['youtube', 'rutube', ''],
        default: '',
      },
      videoId: {
        type: String,
        default: '',
        trim: true,
      },
    },
    // Привязка к навыку из SKILLS_MAP (для связки с weakPoint)
    skillTag: {
      type: String,
      default: '',
      trim: true,
    },
    // Алиас тренажера из AiExercise для кнопки «Закрепить на практике»
    relatedExerciseAlias: {
      type: String,
      default: '',
      trim: true,
    },
    // Простой счетчик просмотров для аналитики
    viewsCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('KnowledgeItem', KnowledgeItemSchema)
