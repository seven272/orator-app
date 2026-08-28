import {
  fetchStartWeddingChallenge,
  fetchSendWeddingResponse,
  fetchFinishWeddingChallenge,
} from '../ai-courses-thunks/weddingChallengeThunks.js'

const buildWeddingChallengeCases = (builder) => {
  builder
    .addCase(fetchStartWeddingChallenge.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(
      fetchStartWeddingChallenge.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'active'
        state.aiChat.preview = action.payload.preview
        state.aiChat.messages = [
          { role: 'assistant', text: action.payload.question },
        ]
        if (action.payload.progressData)
          state.progressData = action.payload.progressData
      },
    )
    .addCase(fetchStartWeddingChallenge.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error = action.payload || 'Ошибка запуска'
    })

    .addCase(fetchSendWeddingResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchSendWeddingResponse.fulfilled, (state, action) => {
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
    })
    .addCase(fetchSendWeddingResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      if (state.aiChat.messages.at(-1)?.role === 'user')
        state.aiChat.messages.pop()
      state.aiChat.error = action.payload || 'Ошибка реплики'
    })

    .addCase(fetchFinishWeddingChallenge.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchFinishWeddingChallenge.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        state.aiChat.aiStatus = 'finished'
        state.status = action.payload.status || 'active'
        state.progressData = action.payload.progressData
        state.currentBlockIndex = action.payload.currentBlockIndex
        state.aiChat.verdict = action.payload.evaluation
      },
    )
    .addCase(
      fetchFinishWeddingChallenge.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        state.aiChat.error = action.payload || 'Ошибка финализации'
      },
    )
}
export default buildWeddingChallengeCases
