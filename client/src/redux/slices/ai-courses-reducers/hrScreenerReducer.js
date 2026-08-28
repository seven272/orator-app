import {
  fetchStartHrScreener,
  fetchSendHrScreenerResponse,
  fetchFinishHrScreener,
} from '../ai-courses-thunks/hrScreenerThunks.js'

const buildHrScreenerCases = (builder) => {
  builder
    /* ==========================================
       📞 FETCH START HR SCREENER
       ========================================== */
    .addCase(fetchStartHrScreener.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartHrScreener.fulfilled, (state, action) => {
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
    .addCase(fetchStartHrScreener.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось запустить скрининг'
    })

    /* ==========================================
       💬 FETCH SEND HR SCREENER RESPONSE
       ========================================== */
    .addCase(fetchSendHrScreenerResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendHrScreenerResponse.fulfilled, (state, action) => {
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
    .addCase(fetchSendHrScreenerResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка обработки реплики'
    })

    /* ==========================================
       🏆 FETCH FINISH HR SCREENER
       ========================================== */
    .addCase(fetchFinishHrScreener.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishHrScreener.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation //  totalScore, feedback, criteria, isScoreCounted
      
    })
    .addCase(fetchFinishHrScreener.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации скрининга'
    })
}

export default buildHrScreenerCases
