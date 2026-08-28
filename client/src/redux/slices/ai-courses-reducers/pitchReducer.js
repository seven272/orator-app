import {
  fetchStartPitchTrainer,
  fetchSendPitchResponse,
  fetchFinishPitchTrainer,
} from '../ai-courses-thunks/pitchThunks.js' // Корректный импорт из новой папки thunks

const buildPitchCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START PITCH TRAINER
       ========================================== */
    .addCase(fetchStartPitchTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartPitchTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active' // Включаем экран чата
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question } // Первый вопрос инвестора
      ]
    })
    .addCase(fetchStartPitchTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер'
    })

    /* ==========================================
       💬 FETCH SEND PITCH RESPONSE
       ========================================== */
    .addCase(fetchSendPitchResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendPitchResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      const { answer, isPitchFinished, user_transcript } = action.payload

      // Если бэкенд вернул распознанный текст пользователя, пушим его
      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        })
      }

      if (isPitchFinished) {
        state.aiChat.aiStatus = 'ready_to_finish' // Меняем статус на появление кнопки финала
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        })
        state.aiChat.aiStatus = 'active'
      }
    })
    .addCase(fetchSendPitchResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      // Откатываем последнее сообщение пользователя, если сервер упал на его реплике
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа'
    })

    /* ==========================================
       🏆 FETCH FINISH PITCH TRAINER
       ========================================== */
    .addCase(fetchFinishPitchTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishPitchTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished' // Включаем экран результатов
      
      // Обновляем глобальный прогресс курса
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      
      // Сохраняем вердикт
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishPitchTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации'
    })
}
export default buildPitchCases
