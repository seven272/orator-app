import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Загружаем конфигурацию из .env
dotenv.config()

// Импортируем наш созданный клиент и метод распознавания
// import { transcribeAudioFile } from './src/services/salutSpeechAxiosClient.js'
import { transcribeAudioFile } from '../utils/salutSpeechAxiosClient.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function runIntegrationTest() {
  // 1. Указываем имя вашего тестового файла
  const audioFileName = 'test.mp3' 
 // Корректный путь к файлу внутри папки src/assets/audio/
  const audioPath = path.resolve(__dirname, '..', 'assets', 'audio', audioFileName)

  console.log('🚀 Запуск комплексного теста SalutSpeech...')

  // 2. Проверяем наличие файла
  if (!fs.existsSync(audioPath)) {
    console.error(`❌ Ошибка: Тестовый файл "${audioFileName}" не найден в корне проекта!`)
    console.log('Пожалуйста, положите короткий аудиофайл в корень и назовите его test.wav')
    return
  }

  try {
    console.log(`📂 Чтение файла ${audioFileName} в бинарный буфер...`)
    const audioBuffer = fs.readFileSync(audioPath)

    // Имитируем MIME-тип (для .wav / .opus)
    // Если у вас .ogg или .webm, замените на 'audio/ogg'
    const mimeType = 'audio/mpeg' 

    console.log('🔄 Шаг 1: Запрос OAuth токена и отправка аудио в Сбер...')
    const transcriptResult = await transcribeAudioFile(audioBuffer, mimeType)

    console.log('\n================ Результат запроса ================')
    
    if (transcriptResult) {
      console.log('✅ Успешно! Текст успешно распознан:')
      console.log(`👉 "${transcriptResult}"`) // Просто выводим строку
    } else {
      console.log('⚠ Сбер вернул пустой результат. Возможно, на аудио тишина?')
    }
    console.log('===================================================\n')


  } catch (error) {
    console.error('\n❌ Тест провален!')
    console.error('Причина ошибки:', error.message)
    console.log('Проверьте правильность CLIENT_ID и CLIENT_SECRET в файле .env\n')
  }
}

runIntegrationTest()
