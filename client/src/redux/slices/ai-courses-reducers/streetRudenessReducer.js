import {
  fetchStartStreetRudeness,
  fetchSendStreetRudenessResponse,
  fetchFinishStreetRudeness,
} from '../ai-courses-thunks/streetRudenessThunks.js'

const buildStreetRudenessCases = (builder) => {
  builder
    .addCase(fetchStartStreetRudeness.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartStreetRudeness.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active'
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question },
      ]
      if (action.payload.progressData)
        state.progressData = action.payload.progressData
    })
    .addCase(fetchStartStreetRudeness.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка запуска'
    })

    .addCase(fetchSendStreetRudenessResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendStreetRudenessResponse.fulfilled,
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
      fetchSendStreetRudenessResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        if (state.aiChat.messages.at(-1)?.role === 'user')
          state.aiChat.messages.pop()
        state.aiChat.error = action.payload || 'Ошибка реплики'
      },
    )

    .addCase(fetchFinishStreetRudeness.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishStreetRudeness.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishStreetRudeness.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации'
    })
}

export default buildStreetRudenessCases
