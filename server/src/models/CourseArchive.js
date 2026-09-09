// models/CourseArchive.js
import mongoose from 'mongoose'

const CourseArchiveSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    courseCode: { 
      type: String, 
      required: true, 
      index: true 
    },
    status: { 
      type: String, 
      enum: ['completed', 'failed'], 
      required: true 
    },
    finishedAt: { 
      type: Date, 
      default: Date.now 
    },
    // Слепок состояния блоков на момент финала (теория, баллы ИИ, отчеты, фидбек)
    blocksProgress: { 
      type: mongoose.Schema.Types.Mixed, 
      required: true 
    }
  },
  { timestamps: true }
)

// Индекс для мгновенного поиска истории по конкретному интенсиву
CourseArchiveSchema.index({ userId: 1, courseCode: 1 })

const CourseArchive = mongoose.model('CourseArchive', CourseArchiveSchema)
export default CourseArchive

