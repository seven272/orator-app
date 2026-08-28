// frontend/src/redux/ai-courses-reducers/vipCloseReducer.js

import {
  fetchStartVipClose,
  fetchSendVipResponse,
  fetchFinishVipClose,
} from '../ai-courses-thunks/vipCloseThunks.js'

const buildVipCloseCases = (builder) => {
  builder
    /* ==========================================
       👑 FETCH START VIP CLOSE TRAINER
       ========================================== */
    .addCase(fetchStartVipClose.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartVipClose.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active' // Переключаем экран на активный чат
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question } // Первая реплика VIP-персоны
      ]
      if (action.payload.progressData) {
        state.progressData = action.payload.progressData
      }
    })
    .addCase(fetchStartVipClose.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер VIP-клиента'
    })

    /* ==========================================
       💬 FETCH SEND VIP RESPONSE
       ========================================== */
    .addCase(fetchSendVipResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendVipResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      const { answer, isSessionFinished, user_transcript, progressData } = action.payload

      // Если бэкенд успешно распознал речь, пушим в массив сообщений
      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        })
      }

      // Синхронизируем стейт прогресса, если он вернулся
      if (progressData) {
        state.progressData = progressData
      }

      // Если достигнут лимит реплик, выводим кнопку перехода к оценке
      if (isSessionFinished) {
        state.aiChat.aiStatus = 'ready_to_finish'
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        })
        state.aiChat.aiStatus = 'active'
      }
    })
    .addCase(fetchSendVipResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      // Откат интерфейса: удаляем реплику пользователя, если бэк не смог ответить
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа клиенту'
    })

    /* ==========================================
       🏆 FETCH FINISH VIP CLOSE TRAINER
       ========================================== */
    .addCase(fetchFinishVipClose.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishVipClose.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished' // Переключаем на экран результатов (графики, фидбэк)
      
      // Обновляем корневые поля глобального прогресса интенсива
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      
      // Сохраняем вердикт нейросети по критериям usp и painFocus
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishVipClose.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации переговоров'
    })
}

export default buildVipCloseCases
