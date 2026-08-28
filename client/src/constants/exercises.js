const SCREEN_STATUS = {
  IDLE: 'idle',// Стартовый экран
  RUNNING: 'running',// Экран с упражнением
  FINISHED: 'finished',// Экран результатов
}

const AI_STATUS = {
  IDLE: 'idle', // Ожидание нажатия кнопки "Начать говорить"
  RECORDING: 'recording', // Пользователь говорит, таймер тикает
  PROCESSING: 'processing', // Голос отправлен на сервер, превращается в текст
  AI_THINKING: 'ai_thinking', // Текст у ИИ, ждем контраргумент
  FINISHED: 'finished',
} 

export { SCREEN_STATUS, AI_STATUS }
