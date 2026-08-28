const IS_DEVELOPMENT_MODE = true // <-- ВКЛЮЧАЕМ РЕЖИМ ТЕСТА

import axiosInstance from '../../utils/axiosInstance'

// Моковые данные для имитации ответов от ИИ
const MOCK_AI_RESPONSES = { 
  start: {
    answer:
      'Приветствую в дебат-клубе! Я буду твоим оппонентом и модератором. Тема: "{topic}". Ты выступаешь за позицию: "{position}". Отлично, начнем. Мой первый вопрос к тебе: каков твой самый сильный аргумент в пользу этой позиции?',
  },
  respond: {
    // Можем сделать разные ответы для разнообразия
    default: {
      answer:
        'Это интересный аргумент. Однако, позвольте уточнить... {userMessage}. Вы не учли фактор X. Как вы можете это прокомментировать?',
    },
    // Пример для конкретной темы
    vaccination: {
      answer:
        'Вы упомянули коллективный иммунитет. Но как быть с правами личности? Не является ли это ущемлением свобод?',
    },
  },
}


// --- 1. Переписываем createAsyncThunk для режима разработки ---
// Старт дебатов
const fetchStartDebate = createAsyncThunk(
  'aiExercise/fetchStartDebate',
  async ({ topic, position }, { rejectWithValue }) => {
    const userId = '66778899aabbccddeeff0011'
    const exerciseType = 'debate'
    const exerciseData = {
      topic,
      position,
    }
    try {
      if (IS_DEVELOPMENT_MODE) {
        // --- РЕЖИМ ТЕСТА: Возвращаем моковые данные через 1 секунду ---
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              answer: MOCK_AI_RESPONSES.start.answer
                .replace('{topic}', topic)
                .replace('{position}', position),
            })
          }, 1000) // Имитация задержки сервера
        })
      } else {
        // --- РЕЖИМ ПРОДАКШН: Реальный запрос ---
        const res = await axiosInstance.post('/ai/start-exercise', {
          userId,
          exerciseType,
          exerciseData,
        })
        return res.data
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при старте дебатов'
      return rejectWithValue(errorMsg)
    }
  },
)

// Отправка ответа пользователя
const fetchSendUserResponseDebate = createAsyncThunk(
  'aiExercise/fetchSendUserResponseDebate',
  async ({ topic, position, userMessage }, { rejectWithValue }) => {
    try {
      if (IS_DEVELOPMENT_MODE) {
        // --- РЕЖИМ ТЕСТА: Возвращаем моковый ответ ---
        return new Promise((resolve) => {
          setTimeout(() => {
            let answer = MOCK_AI_RESPONSES.respond.default.answer

            // Логика для разных тем (пример)
            if (topic.toLowerCase().includes('вакцинац')) {
              answer = MOCK_AI_RESPONSES.respond.vaccination.answer
            }

            resolve({
              answer: answer.replace('{userMessage}', userMessage),
              isRoundFinished: false, // Можно симулировать конец раунда
            })
          }, 1500) // Имитация "мышления" ИИ
        })
      } else {
        // --- РЕЖИМ ПРОДАКШН: Реальный запрос ---
        const res = await axiosInstance.post('/ai/response-debate', {
          topic,
          position,
          userMessage,
        })
        return res.data
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        'Ошибка сервера при отправке ответа'
      return rejectWithValue(errorMsg)
    }
  },
)