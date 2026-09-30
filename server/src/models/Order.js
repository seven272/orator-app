import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema(
  {
    orderId: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    }, // Idempotence-Key (UUIDv4)
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    typeOrder: { 
      type: String, 
      enum: ['premium_subscription', 'course_purchase'], 
      required: true 
    },
    itemCode: { 
      type: String, 
      required: true 
    }, // 'premium_30d' или 'sales_master'
    amount: { 
      type: Number, 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['created', 'completed', 'failed'], 
      default: 'created',
      index: true
    },
  },
  { timestamps: true }
)

const Order = mongoose.model('Order', OrderSchema)
export default Order
