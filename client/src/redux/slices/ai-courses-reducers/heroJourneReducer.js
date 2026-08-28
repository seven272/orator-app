import {
  fetchStartHeroJourney,
  fetchSendHeroJourneyResponse,
  fetchFinishHeroJourney,
} from '../ai-courses-thunks/heroJourneyThunks.js';

const buildHeroJourneyCases = (builder) => {
  builder
    /* ==========================================
       🏹 НАЧАЛО ТРЕНИРОВКИ "ПУТЬ ГЕРОЯ"
       ========================================== */
    .addCase(fetchStartHeroJourney.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
      state.aiChat.error = null;
    })
    .addCase(fetchStartHeroJourney.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'active';
      state.aiChat.preview = action.payload.preview;
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }
      ];
      if (action.payload.progressData) {
        state.progressData = action.payload.progressData;
      }
    })
    .addCase(fetchStartHeroJourney.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Не удалось запустить тренировку повествования';
    })

    /* ==========================================
       💬 ОТПРАВКА ОТВЕТА В ТРЕНАЖЕР
       ========================================== */
    .addCase(fetchSendHeroJourneyResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchSendHeroJourneyResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      const { answer, isSessionFinished, user_transcript, progressData } = action.payload;

      if (user_transcript) {
        state.aiChat.messages.push({ role: 'user', text: user_transcript });
      }
      if (progressData) {
        state.progressData = progressData;
      }

      if (isSessionFinished) {
        state.aiChat.aiStatus = 'ready_to_finish';
      } else {
        state.aiChat.messages.push({ role: 'assistant', text: answer });
        state.aiChat.aiStatus = 'active';
      }
    })
    .addCase(fetchSendHeroJourneyResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      // Если запрос упал, а пользовательское сообщение успело добавиться локально — удаляем его для чистоты истории
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop();
      }
      state.aiChat.error = action.payload || 'Ошибка отправки устного ответа';
    })

    /* ==========================================
       🏆 ЗАВЕРШЕНИЕ И АНАЛИЗ ТРЕНИРОВКИ "ПУТЬ ГЕРОЯ"
       ========================================== */
    .addCase(fetchFinishHeroJourney.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchFinishHeroJourney.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'finished';
      state.status = action.payload.status || 'active';
      state.progressData = action.payload.progressData;
      state.currentBlockIndex = action.payload.currentBlockIndex;
      // Сюда бэкенд вернет оценки по критериям dramaturgyStructure и emotionalHook
      state.aiChat.verdict = action.payload.evaluation; 
    })
    .addCase(fetchFinishHeroJourney.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Ошибка расчета результатов повествования';
    });
};

export default buildHeroJourneyCases;
