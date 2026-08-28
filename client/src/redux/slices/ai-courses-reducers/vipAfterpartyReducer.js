import {
  fetchStartVipAfterparty,
  fetchSendVipAfterpartyResponse,
  fetchFinishVipAfterparty,
} from '../ai-courses-thunks/vipAfterpartyThunks.js'

const buildVipAfterpartyCases = (builder) => {
  builder
    /* ==========================================
       🥂 FETCH START VIP AFTERPARTY
       ========================================== */
    .addCase(fetchStartVipAfterparty.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartVipAfterparty.fulfilled, (state, action) => {
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
    .addCase(fetchStartVipAfterparty.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload || 'Не удалось войти на афтерпати'
    })

    /* ==========================================
       💬 FETCH SEND VIP AFTERPARTY RESPONSE
       ========================================== */
    .addCase(fetchSendVipAfterpartyResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendVipAfterpartyResponse.fulfilled,
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
      fetchSendVipAfterpartyResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки ответа на афтерпати'
      },
    )

    /* ==========================================
       🏆 FETCH FINISH VIP AFTERPARTY
       ========================================== */
    .addCase(fetchFinishVipAfterparty.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishVipAfterparty.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation // Критерии charismaStatus и ecologicalExit
    })
    .addCase(fetchFinishVipAfterparty.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload || 'Ошибка финализации VIP-сессии'
    })
}
export default buildVipAfterpartyCases
