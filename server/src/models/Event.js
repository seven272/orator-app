import mongoose from 'mongoose'

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    format: {
      type: String,
      enum: ['online', 'offline'],
      required: true,
    },
    city: {
      type: String,
      default: '',
      trim: true,
    },
    // Закрытые данные (адрес или ссылка на Zoom/чат) — отдаем только оплатившим участникам
    secretLocationOrLink: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      default: 90,
    },
    maxSeats: {
      type: Number,
      required: true,
      min: 1,
    },
    // Цена в рублях (0 — если мероприятие бесплатное)
    priceRub: {
      type: Number,
      required: true,
      min: 0,
    },
    // Список подтвержденных участников
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        attended: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('Event', EventSchema)
