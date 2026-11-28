import mongoose from 'mongoose'

const EventOrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    amountRub: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'canceled'],
      default: 'pending',
    },
    yookassaPaymentId: {
      type: String,
      default: '',
      trim: true,
    },
    confirmationUrl: {
      type: String,
      default: '',
    },
    // Время истечения временной брони места (например, +15 минут от создания)
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

export default mongoose.model('EventOrder', EventOrderSchema)
