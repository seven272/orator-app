import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema({
  alias: { type: String, required: true }, 
  title: { type: String, required: true },
  description: { type: String }, 
  level: { type: Number, enum: [1, 2, 3], required: true },
  skill: { type: String },
  reward: { type: Number, default: 30 },
  premium: { type: Boolean, default: false }, 
  goal: { type: Number, default: 1 },
  isGlobal: { type: Boolean, default: true }, // Одинаково ли задание для всех сегодня
})

export default mongoose.model('Task', taskSchema)
