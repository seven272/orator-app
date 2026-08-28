import {
  fetchStartAntiFlatteryTrainer,
  fetchSendAntiFlatteryResponse,
  fetchFinishAntiFlatteryTrainer,
} from '../ai-courses-thunks/antiFlatteryThunks.js'

const buildAntiFlatteryCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START ANTI FLATTERY TRAINER
       ========================================== */
    .addCase(fetchStartAntiFlatteryTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(
      fetchStartAntiFlatteryTrainer.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'active'
        state.aiChat.preview = action.payload.preview
        console.log(action.payload.preview)
        state.aiChat.messages = [
          { role: 'assistant', text: action.payload.question },
        ]
      },
    )
    .addCase(
      fetchStartAntiFlatteryTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload ||
          'Не удалось запустить тренажер Тонкая грань'
      },
    )

    /* ==========================================
       💬 FETCH SEND ANTI FLATTERY RESPONSE
       ========================================== */
    .addCase(fetchSendAntiFlatteryResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendAntiFlatteryResponse.fulfilled,
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
          state.aiChat.aiStatus = 'ready_to_finish' // Рендерит кнопку "Получить оценку искренности"
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
      fetchSendAntiFlatteryResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки ответа другу'
      },
    )

    /* ==========================================
       🏆 FETCH FINISH ANTI FLATTERY TRAINER
       ========================================== */
    .addCase(fetchFinishAntiFlatteryTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchFinishAntiFlatteryTrainer.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'finished' // Экран аналитики

        state.status = action.payload.status || 'active'
        state.progressData = action.payload.progressData
        state.currentBlockIndex = action.payload.currentBlockIndex

        // Вердикт ИИ-критика: { totalScore, feedback, criteria: { sincerity, focus }, isScoreCounted }
        state.aiChat.verdict = action.payload.evaluation
      },
    )
    .addCase(
      fetchFinishAntiFlatteryTrainer.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error =
          action.payload || 'Ошибка получения оценки искренности'
      },
    )
}

export default buildAntiFlatteryCases
