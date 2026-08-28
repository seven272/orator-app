import mongoose from 'mongoose'

const dailyTaskSchema = new mongoose.Schema({
  date: { type: String, unique: true }, // Формат "YYYY-MM-DD"
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }]
})

export default mongoose.model('DailyTask', dailyTaskSchema)
