import mongoose from 'mongoose'

const liveDuelSchema = new mongoose.Schema({
  // Кто создал комнату / Инициатор
  userA: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  // Второй участник: реальный ObjectId, либо null (пока ищем), либо специальный ID для ИИ
  userB: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Тип создания комнаты
  creationType: {
    type: String,
    enum: ['quick_search', 'direct_link', 'calendar'], // Значения enum оставляем как в БД
    required: true,
  },
  // Выбранная тема дискуссии
  topic: {
    title: { type: String, required: true },
    sideA: { type: String, required: true }, // Позиция Первого
    sideB: { type: String, required: true }, // Позиция Второго
  },
  // Специфические поля для разных механик
  inviteToken: { type: String, unique: true, sparse: true }, // Для Механики 4 (ссылка)
  scheduledAt: { type: Date, index: true }, // Для Механики 2 (календарь)

  // === ОБНОВЛЕННЫЕ ПОЛЯ ПОД СТАНДАРТ VK CALLS ===
  vkCallLink: { type: String, default: '' }, // Реальная ссылка из VKWebAppCallStart
  vkCallId: { type: String, default: '' },   // ID сессии звонка для аналитики

  ratingFromA: {
    type: Number,
    min: 1,
    max: 5,
    default: null, // Игрок А еще не оценил Игрока Б
  },
  ratingFromB: {
    type: Number,
    min: 1,
    max: 5,
    default: null, // Игрок Б еще не оценил Игрока А
  },

  pointsEarnedA: { type: Number, default: 0 },
  pointsEarnedB: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'canceled'],
    default: 'pending',
    index: true,
  },

 
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.model('LiveDuel', liveDuelSchema)
 