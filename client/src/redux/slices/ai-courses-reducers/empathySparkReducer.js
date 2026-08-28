import {
  fetchStartEmpathySparkTrainer,
  fetchSendEmpathySparkResponse,
  fetchFinishEmpathySparkTrainer,
} from '../ai-courses-thunks/empathySparkThunks.js'

const buildEmpathySparkCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START EMPATHY SPARK TRAINER
       ========================================== */
    .addCase(fetchStartEmpathySparkTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(
      fetchStartEmpathySparkTrainer.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'active'
        state.aiChat.preview = action.payload.preview
        state.aiChat.messages = [
          { role: 'assistant', text: action.payload.question },
        ]
      },
    )
    .addCase(
      fetchStartEmpathySparkTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload ||
          'Не удалось запустить тренажер Искра доверия'
      },
    )

    /* ==========================================
       💬 FETCH SEND EMPATHY SPARK RESPONSE
       ========================================== */
    .addCase(fetchSendEmpathySparkResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendEmpathySparkResponse.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        const { answer, isPitchFinished, user_transcript } =
          action.payload

        if (user_transcript) {
          state.aiChat.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        if (isPitchFinished) {
          state.aiChat.aiStatus = 'ready_to_finish' // Рендерит кнопку "Узнать, оттаял ли попутчик"
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
      fetchSendEmpathySparkResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки ответа попутчику'
      },
    )

    /* ==========================================
       🏆 FETCH FINISH EMPATHY SPARK TRAINER
       ========================================== */
    .addCase(fetchFinishEmpathySparkTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchFinishEmpathySparkTrainer.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'finished' // Экран аналитики

        state.status = action.payload.status || 'active'
        state.progressData = action.payload.progressData
        state.currentBlockIndex = action.payload.currentBlockIndex

        // Вердикт ИИ-критика: { totalScore, feedback, criteria: { observation, relevance }, isScoreCounted }
        state.aiChat.verdict = action.payload.evaluation
      },
    )
    .addCase(
      fetchFinishEmpathySparkTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload || 'Ошибка получения вердикта попутчика'
      },
    )
}

export default buildEmpathySparkCases
