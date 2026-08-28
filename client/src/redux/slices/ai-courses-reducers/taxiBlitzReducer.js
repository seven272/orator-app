import {
  fetchStartTaxiBlitzTrainer,
  fetchSendTaxiBlitzResponse,
  fetchFinishTaxiBlitzTrainer,
} from '../ai-courses-thunks/taxiBlitzThunks.js';

const buildTaxiBlitzCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START TAXI BLITZ TRAINER
       ========================================== */
    .addCase(fetchStartTaxiBlitzTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
      state.aiChat.error = null;
    })
    .addCase(fetchStartTaxiBlitzTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'active';
      state.aiChat.preview = action.payload.preview;
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }
      ];
    })
    .addCase(fetchStartTaxiBlitzTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер Такси-Блиц';
    })

    /* ==========================================
       💬 FETCH SEND TAXI BLITZ RESPONSE
       ========================================== */
    .addCase(fetchSendTaxiBlitzResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchSendTaxiBlitzResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      const { answer, isPitchFinished, user_transcript } = action.payload;

      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        });
      }

      if (isPitchFinished) {
        state.aiChat.aiStatus = 'ready_to_finish'; // Рендерит кнопку вердикта водителя
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        });
        state.aiChat.aiStatus = 'active';
      }
    })
    .addCase(fetchSendTaxiBlitzResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop();
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа водителю';
    })

    /* ==========================================
       🏆 FETCH FINISH TAXI BLITZ TRAINER
       ========================================== */
    .addCase(fetchFinishTaxiBlitzTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchFinishTaxiBlitzTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'finished'; // Экран аналитики
      
      state.status = action.payload.status || 'active';
      state.progressData = action.payload.progressData;
      state.currentBlockIndex = action.payload.currentBlockIndex;
      
      // Набор критериев: { totalScore, feedback, criteria: { reactionSpeed, structuralFrame }, isScoreCounted }
      state.aiChat.verdict = action.payload.evaluation;
    })
    .addCase(fetchFinishTaxiBlitzTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Ошибка получения вердикта водителя';
    });
};

export default buildTaxiBlitzCases;
