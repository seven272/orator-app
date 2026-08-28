import {
  fetchStartNetworking,
  fetchSendNetworkingResponse,
  fetchFinishNetworking,
} from '../ai-courses-thunks/networkingThunks.js'

const buildNetworkingCases = (builder) => {
  builder
    /* ==========================================
       🤝 FETCH START NETWORKING TRAINER
       ========================================== */
    .addCase(fetchStartNetworking.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
      state.aiChat.error = null
    })
    .addCase(fetchStartNetworking.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'active' // Включаем экран активного чата
      state.aiChat.preview = action.payload.preview
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }, // Первый вопрос собеседника
      ]
      if (action.payload.progressData) {
        state.progressData = action.payload.progressData
      }
    })
    .addCase(fetchStartNetworking.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload || 'Не удалось запустить тренажер нетворкинга'
    })

    /* ==========================================
       💬 FETCH SEND NETWORKING RESPONSE
       ========================================== */
    .addCase(fetchSendNetworkingResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(
      fetchSendNetworkingResponse.fulfilled,
      (state, action) => {
        state.aiChat.chatStatus = 'succeeded'
        const {
          answer,
          isSessionFinished,
          user_transcript,
          progressData,
        } = action.payload

        // Если бэкенд успешно распознал аудиозапись, пушим её в интерфейс
        if (user_transcript) {
          state.aiChat.messages.push({
            role: 'user',
            text: user_transcript,
          })
        }

        // Синхронизируем стейт прогресса курса
        if (progressData) {
          state.progressData = progressData
        }

        // Если лимит реплик исчерпан, выводим кнопку перехода к вердикту
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
      fetchSendNetworkingResponse.rejected,
      (state, action) => {
        state.aiChat.chatStatus = 'failed'
        // Безопасный откат интерфейса при падении запроса
        if (state.aiChat.messages.at(-1)?.role === 'user') {
          state.aiChat.messages.pop()
        }
        state.aiChat.error =
          action.payload || 'Ошибка отправки ответа собеседнику'
      },
    )

    /* ==========================================
       🏆 FETCH FINISH NETWORKING TRAINER
       ========================================== */
    .addCase(fetchFinishNetworking.pending, (state) => {
      state.aiChat.chatStatus = 'loading'
    })
    .addCase(fetchFinishNetworking.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded'
      state.aiChat.aiStatus = 'finished' // Переключаем на финальный экран результатов

      // Обновляем глобальный прогресс интенсива
      state.status = action.payload.status || 'active'
      state.progressData = action.payload.progressData
      state.currentBlockIndex = action.payload.currentBlockIndex

      // Сохраняем подробный разбор по критериям positioning и callToAction
      state.aiChat.verdict = action.payload.evaluation
    })
    .addCase(fetchFinishNetworking.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed'
      state.aiChat.error =
        action.payload || 'Ошибка финализации нетворк-сессии'
    })
}

export default buildNetworkingCases
