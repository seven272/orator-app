import mongoose from 'mongoose'

const shopItemSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // 'streak_freeze', 'theme_politics'
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: {
    type: String,
    enum: ['utility', 'theme', 'achievement',  'merch'],
    required: true,
  },
  icon: { type: String }, // Техническое имя иконки для фронтенда
})

export default mongoose.model('ShopItem', shopItemSchema)
