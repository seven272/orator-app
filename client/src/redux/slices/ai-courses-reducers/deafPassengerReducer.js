import {
  fetchStartDeafPassengerTrainer,
  fetchSendDeafPassengerResponse,
  fetchFinishDeafPassengerTrainer,
} from '../ai-courses-thunks/deafPassengerThunks.js'

const buildDeafPassengerCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START DEAF PASSENGER TRAINER
       ========================================== */
    .addCase(fetchStartDeafPassengerTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(
      fetchStartDeafPassengerTrainer.fulfilled,
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
      fetchStartDeafPassengerTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload ||
          'Не удалось запустить тренажер Попутчик-Глухарь'
      },
    )

    /* ==========================================
       💬 FETCH SEND DEAF PASSENGER RESPONSE
       ========================================== */
    .addCase(fetchSendDeafPassengerResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendDeafPassengerResponse.fulfilled,
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
          state.aiChat.aiStatus = 'ready_to_finish' // Рендерит кнопку "Получить оценку перехвата руля"
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
      fetchSendDeafPassengerResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки ответа рассказчику'
      },
    )

    /* ==========================================
       🏆 FETCH FINISH DEAF PASSENGER TRAINER
       ========================================== */
    .addCase(fetchFinishDeafPassengerTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchFinishDeafPassengerTrainer.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'finished' // Экран аналитики

        state.status = action.payload.status || 'active'
        state.progressData = action.payload.progressData
        state.currentBlockIndex = action.payload.currentBlockIndex

        // Набор критериев: { totalScore, feedback, criteria: { interruptionTiming, focusReturn }, isScoreCounted }
        state.aiChat.verdict = action.payload.evaluation
      },
    )
    .addCase(
      fetchFinishDeafPassengerTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload || 'Ошибка получения оценки перехвата руля'
      },
    )
}

export default buildDeafPassengerCases
