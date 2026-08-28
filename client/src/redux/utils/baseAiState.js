const createBaseAiState = (additionalFields = {}) => ({
  messages: [], // { role: 'assistant' | 'user', text: string }
  exStatus: 'idle', // idle | loading | succeeded | failed
  aiStatus: 'idle', // idle | recording | processing | ai_thinking | finished
  verdict: null, // { totalScore, feedback, criteria }
  error: null,
  ...additionalFields, // Возможность расширить стейт (например, warmth для Ледокола)
})

const setAiPending = (state) => {
  state.exStatus = 'loading'
  state.error = null
}

const setAiRejected = (state, action) => {
  state.exStatus = 'failed'
  state.error = action.payload
}

export { createBaseAiState, setAiPending, setAiRejected }
