import {
  fetchStartFiascoTurn,
  fetchSendFiascoTurnResponse,
  fetchFinishFiascoTurn,
} from '../ai-courses-thunks/fiascoTurnThunks.js'

const buildFiascoTurnCases = (builder) => {
  builder
    /* ==========================================
       💎 НАЧАЛО ТРЕНИРОВКИ "ИЗ ПРОВАЛА В ТРИУМФ"
       ========================================== */
    .addCase(fetchStartFiascoTurn.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartFiascoTurn.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active'
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question },
      ]
      if (action.payload.progressData) {
        state.progressData = action.payload.progressData
      }
    })
    .addCase(fetchStartFiascoTurn.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload ||
        'Не удалось запустить тренировку разбора ошибок'
    })

    /* ==========================================
       💬 ОТПРАВКА ОТВЕТА В ТРЕНАЖЕР
       ========================================== */
    .addCase(fetchSendFiascoTurnResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendFiascoTurnResponse.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        const {
          answer,
          isSessionFinished,
          user_transcript,
          progressData,
        } = action.payload

        if (user_transcript) {
          state.aiChat.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }
        if (progressData) {
          state.progressData = progressData
        }

        if (isSessionFinished) {
          state.aiChat.aiStatus = 'ready_to_finish'
        } else {
          state.aiChat.messages.push({
            role: 'assistant',
            text: answer,
          })
          state.aiChat.aiStatus = 'active'
        }
      },
    )
    .addCase(
      fetchSendFiascoTurnResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки устного ответа'
      },
    )

    /* ==========================================
       🏆 ЗАВЕРШЕНИЕ И АНАЛИЗ ТРЕНИРОВКИ "ИЗ ПРОВАЛА В ТРИУМФ"
       ========================================== */
    .addCase(fetchFinishFiascoTurn.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishFiascoTurn.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      // Сюда бэкенд вернет оценки по критериям vulnerabilityBalance и lessonExtracted
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishFiascoTurn.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload || 'Ошибка расчета результатов разбора ошибок'
    })
}

export default buildFiascoTurnCases
