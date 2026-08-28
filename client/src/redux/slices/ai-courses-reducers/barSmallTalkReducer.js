import {
  fetchStartBarSmallTalk,
  fetchSendBarSmallTalkResponse,
  fetchFinishBarSmallTalk,
} from '../ai-courses-thunks/barSmallTalkThunks.js'

const buildBarSmallTalkCases = (builder) => {
  builder
    /* ==========================================
       🍹 FETCH START BAR SMALL TALK
       ========================================== */
    .addCase(fetchStartBarSmallTalk.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartBarSmallTalk.fulfilled, (state, action) => {
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
    .addCase(fetchStartBarSmallTalk.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Не удалось начать Small Talk'
    })

    /* ==========================================
       💬 FETCH SEND BAR SMALL TALK RESPONSE
       ========================================== */
    .addCase(fetchSendBarSmallTalkResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendBarSmallTalkResponse.fulfilled, (state, action) => {
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
    .addCase(fetchSendBarSmallTalkResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop()
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа'
    })

    /* ==========================================
       🏆 FETCH FINISH BAR SMALL TALK
       ========================================== */
    .addCase(fetchFinishBarSmallTalk.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishBarSmallTalk.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation // Критерии iceBreaking и conversationalFlow
    })
    .addCase(fetchFinishBarSmallTalk.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации Small Talk'
    })
}
export default buildBarSmallTalkCases