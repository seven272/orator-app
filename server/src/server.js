process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' //убрать в продакшене, и установить сетрификаты Миецифры
import express from 'express'
import path from 'path'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import { connectDB } from './config/db.js'
import corsOptions from './config/corsOptions.js'
import { initCronJobs } from './config/cronService.js'
import userRoutes from './routes/userRoutes.js'
import aiExerciseRoutes from './routes/aiExerciseRoutes.js'
import exerciseRoutes from './routes/exerciseRoutes.js'
import dailyTaskRoutes from './routes/dailyTaskRoutes.js'
import leaderboardRoutes from './routes/leaderboardRoutes.js'
import shopRoutes from './routes/shopRoutes.js'
import challengeRoutes from './routes/challengeRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import liveDuelRoutes from './routes/liveDuelRoutes.js'
import courseRoutes from './routes/courseRoutes.js'

dotenv.config()

const __dirname = import.meta.dirname
const PORT = process.env.PORT || 5020

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))
// чтобы парсить вложенные данные(например обьекты) передаваемые в req.body
app.use(express.urlencoded({ extended: true }))

//Мидлвар для изображений. При попытке загрузить изображение сервер отправляет get запрос на получение  изображения http://localhost:5000/static/name-folder/name-image.jpg, и я отправляю сервер искать в папку с изображениями uploads, чтобы проверить есть ли там файл с таким именем.
app.use('/api/static', express.static(path.join(__dirname, 'uploads')))

app.use('/api/user', userRoutes)
app.use('/api/ai', aiExerciseRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/daily-tasks', dailyTaskRoutes)
app.use('/api/leaderboard', leaderboardRoutes)
app.use('/api/shop', shopRoutes)
app.use('/api/challenges', challengeRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/live/', liveDuelRoutes)
app.use('/api/courses', courseRoutes)

const start = async () => {
  try {
    await connectDB()
    initCronJobs() //автоматическая ф-я обновления недельного рейтинга пользователей
    app.listen(PORT, () => {
      console.log(`Сервер успешно запущен на порту ${PORT}`)
    })
  } catch (error) {
    console.error(`❌ Ошибка при подключении к серверу: `, error)
  }
}

start()
