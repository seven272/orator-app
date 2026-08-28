import {
  fetchStartTimeLimitPitch,
  fetchSendTimeLimitResponse,
  fetchFinishTimeLimitPitch,
} from '../ai-courses-thunks/timeLimitPitchThunks.js'

const buildTimeLimitPitchCases = (builder) => {
  builder
    .addCase(fetchStartTimeLimitPitch.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartTimeLimitPitch.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active'
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question },
      ]
      if (action.payload.progressData)
        state.progressData = action.payload.progressData
    })
    .addCase(fetchStartTimeLimitPitch.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка запуска'
    })

    .addCase(fetchSendTimeLimitResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendTimeLimitResponse.fulfilled,
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
    .addCase(fetchSendTimeLimitResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      if (state.aiChat.messages.at(-1)?.role === 'user')
        state.aiChat.messages.pop()
      state.aiChat.error = action.payload || 'Ошибка реплики'
    })

    .addCase(fetchFinishTimeLimitPitch.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishTimeLimitPitch.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished'
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishTimeLimitPitch.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка финализации'
    })
}

export default buildTimeLimitPitchCases
