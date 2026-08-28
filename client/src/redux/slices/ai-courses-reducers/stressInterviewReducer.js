import {
  fetchStartStressInterview,
  fetchSendStressResponse,
  fetchFinishStressInterview,
} from '../ai-courses-thunks/stressInterviewThunks.js'

const buildStressInterviewCases = (builder) => {
  builder
    /* ==========================================
       🔥 FETCH START STRESS INTERVIEW
       ========================================== */
    .addCase(fetchStartStressInterview.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartStressInterview.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active'
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }
      ]
      if (action.payload.progressData) {
        state.progressData = action.payload.progressData
      }
    })
    .addCase(fetchStartStressInterview.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось запустить стресс-интервью'
    })

    /* ==========================================
       💬 FETCH SEND STRESS RESPONSE
       ========================================== */
    .addCase(fetchSendStressResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendStressResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      const { answer, isSessionFinished, user_transcript, progressData } = action.payload

      if (user_transcript) {
        state.aiChat.messages.push({ role: 'user', text: user_transcript })
      }
      if (progressData) {
        state.progressData = progressData
      }

      if (isSessionFinished) {
        state.aiChat.aiStatus = 'ready_to_finish'
      } else {
        state.aiChat.messages.push({ role: 'assistant', text: answer })
        state.aiChat.aiStatus = 'active'
      }
    })
    .addCase(fetchSendStressResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка ответа руководителю'
    })

    /* ==========================================
       🏆 FETCH FINISH STRESS INTERVIEW
       ========================================== */
    .addCase(fetchFinishStressInterview.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishStressInterview.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation // Критерии stressResistance и reflection
    })
    .addCase(fetchFinishStressInterview.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации стресс-интервью'
    })
}

export default buildStressInterviewCases