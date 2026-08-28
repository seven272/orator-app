import {
  fetchStartObjectionTrainer,
  fetchSendObjectionResponse,
  fetchFinishObjectionTrainer,
} from '../ai-courses-thunks/objectionThunks.js'

const buildObjectionCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START OBJECTION TRAINER
       ========================================== */
    .addCase(fetchStartObjectionTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartObjectionTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active' // Открываем чат
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question } // Первая реплика недовольного клиента
      ]
    })
    .addCase(fetchStartObjectionTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер возражений'
    })

    /* ==========================================
       💬 FETCH SEND OBJECTION RESPONSE
       ========================================== */
    .addCase(fetchSendObjectionResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendObjectionResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      const { answer, isPitchFinished, user_transcript } = action.payload

      // Пушим распознанный текст менеджера
      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        })
      }

      // На бэкенде isPitchFinished завязан на флаг окончания (5 шагов)
      if (isPitchFinished) {
        state.aiChat.aiStatus = 'ready_to_finish' // Показываем кнопку "Узнать вердикт клиента"
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        })
        state.aiChat.aiStatus = 'active'
      }
    })
    .addCase(fetchSendObjectionResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      // Удаляем последнее сообщение юзера, если бэк отвалился, чтобы не ломать историю
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа клиенту'
    })

    /* ==========================================
       🏆 FETCH FINISH OBJECTION TRAINER
       ========================================== */
    .addCase(fetchFinishObjectionTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishObjectionTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished' // Переключаем на экран аналитики
      
      // Обновляем прогресс интенсива в базе данных
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      
      // Записываем финальную оценку { totalScore, feedback, criteria: { empathy, argumentation } }
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishObjectionTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка получения вердикта клиента'
    })
}

export default buildObjectionCases
