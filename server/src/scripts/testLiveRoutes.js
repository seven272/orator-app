import request from 'supertest'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

// НАСТРОЙКА: Укажите URL или импортируйте инстанс, но так как сервер запущен на порту 5020, 
// мы можем слать запросы на локальный порт напрямую
const BASE_URL = `http://localhost:${process.env.PORT || 5020}`
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

// Фейковые ID для симуляции MongoDB пользователей
const MOCK_USER_A_ID = '65a7f000000000000000000a'
const MOCK_USER_B_ID = '65a7f000000000000000000b'

// Генерируем валидные JWT строки
const tokenA = jwt.sign({ userId: MOCK_USER_A_ID }, JWT_SECRET, { expiresIn: '1h' })
const tokenB = jwt.sign({ userId: MOCK_USER_B_ID }, JWT_SECRET, { expiresIn: '1h' })

// Форматируем куки под стандарт cookie-parser. 
// Замените 'token' на то имя куки, которое прописано у вас в authMiddleware (например, 'jwt' или 'token')
const cookieName = 'jwt-oratory'
const mockCookieA = `${cookieName}=${tokenA}`
const mockCookieB = `${cookieName}=${tokenB}`

const logStep = (message, success = true) => {
  console.log(`${success ? '✅' : '❌'} ${message}`)
}

async function runCookieMockTest() {
  console.log('🚀 ЗАПУСК МОК-СКРИПТА ЖИВЫХ ДУЭЛЕЙ С ПОДДЕРЖКОЙ КУК...\n')
  
  let activeRoomId = null
  let activeInviteToken = null

  try {
    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 1: Запрос без куки (Проверка защиты)
    // ------------------------------------------------------------------------
    const authRes = await request(BASE_URL)
      .post('/api/live/create-room')
      .send({ creation_type: 'quick_search' })

    if (authRes.status === 401 || authRes.status === 403) {
      logStep('Защита роутов через куки работает: запрос без сессии заблокирован')
    } else {
      logStep(`Внимание: роут пропустил запрос без куки авторизации (Статус: ${authRes.status})`, false)
    }

    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 2: Игрок А создает комнату Быстрого Поиска (Передаем Куку А)
    // ------------------------------------------------------------------------
    const createRes = await request(BASE_URL)
      .post('/api/live/create-room')
      .set('Cookie', [mockCookieA]) // Передаем сформированную куку в заголовке
      .send({ creation_type: 'quick_search' })

    if (createRes.status === 201 && createRes.body.success) {
      activeRoomId = createRes.body.room._id
      logStep(`Игрок А успешно авторизован по куке и создал комнату (ID: ${activeRoomId})`)
    } else {
      throw new Error(`Не удалось создать комнату: ${createRes.body.message || createRes.status}`)
    }

    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 3: Проверка защиты от дуэли с самим собой
    // ------------------------------------------------------------------------
    const selfJoinRes = await request(BASE_URL)
      .post('/api/live/join-room')
      .set('Cookie', [mockCookieA]) // Снова отправляем куку Игрока А
      .send({ room_id: activeRoomId })

    if (selfJoinRes.status === 400) {
      logStep('Защита «Сам с собой» подтверждена: Игрок А получил отказ на вход в свою комнату')
    } else {
      logStep(`Ошибка: Сервер позволил зайти в комнату под той же кукой создателя (Статус: ${selfJoinRes.status})`, false)
    }

    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 4: Игрок Б подключается через Быстрый Поиск (Передаем Куку Б)
    // ------------------------------------------------------------------------
    const quickJoinRes = await request(BASE_URL)
      .post('/api/live/join-room')
      .set('Cookie', [mockCookieB]) // Передаем куку Игрока Б
      .send({})

    if (quickJoinRes.status === 200 && quickJoinRes.body.room.status === 'active') {
      logStep(`Матчмейкинг через куки успешен! Игрок Б соединен. Звонок: ${quickJoinRes.body.room.vk_call_link}`)
    } else {
      throw new Error(`Игрок Б не смог заматчиться: ${quickJoinRes.body.message}`)
    }

    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 5: Ветка инвайт-ссылок (Игрок А создает -> Игрок Б заходит)
    // ------------------------------------------------------------------------
    console.log('\n--- Тест ветки прямых инвайт-ссылок ---')

    const linkCreateRes = await request(BASE_URL)
      .post('/api/live/create-room')
      .set('Cookie', [mockCookieA])
      .send({ creation_type: 'direct_link' })

    activeInviteToken = linkCreateRes.body.room.invite_token
    logStep(`Игрок А сгенерировал инвайт-токен: ${activeInviteToken}`)

    const linkJoinRes = await request(BASE_URL)
      .post('/api/live/join-room')
      .set('Cookie', [mockCookieB])
      .send({ invite_token: activeInviteToken })

    if (linkJoinRes.status === 200 && linkJoinRes.body.room.status === 'active') {
      logStep('Игрок Б успешно авторизовался по куке и вошел в комнату по инвайту')
    } else {
      throw new Error(`Вход по ссылке через куки сломан: ${linkJoinRes.body.message}`)
    }

    // ------------------------------------------------------------------------
    // СЦЕНАРИЙ 6: Проверка фолбэка на ИИ-бота при тайм-ауте
    // ------------------------------------------------------------------------
    console.log('\n--- Тест автоматического фолбэка на ИИ ---')

    const aiRoomRes = await request(BASE_URL)
      .post('/api/live/create-room')
      .set('Cookie', [mockCookieA])
      .send({ creation_type: 'quick_search' })

    const emptyRoomId = aiRoomRes.body.room._id

    const fallbackRes = await request(BASE_URL)
      .post('/api/live/fallback-ai')
      .set('Cookie', [mockCookieA])
      .send({ room_id: emptyRoomId })

    if (fallbackRes.status === 200 && fallbackRes.body.room.is_ai_bot) {
      logStep('Фолбэк на ИИ успешно отработал под сессией кук!')
      console.log(`🤖 Ответ GigaChat: "${fallbackRes.body.ai_greeting}"`)
    } else {
      throw new Error(`Фолбэк на ИИ завершился неудачно: ${fallbackRes.body.message}`)
    }

    console.log('\n🎯 ТЕСТИРОВАНИЕ КУКИ-СЕССИЙ ДЛЯ ЖИВЫХ ДУЭЛЕЙ ЗАВЕРШЕНО УСПЕШНО!')

  } catch (error) {
    logStep(error.message, false)
    console.log('\n🛑 МОК-ТЕСТ ПРЕРВАН ИЗ-ЗА КРИТИЧЕСКОЙ ОШИБКИ.')
  }
}

runCookieMockTest()
