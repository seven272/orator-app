import {
  fetchStartVintageScoutTrainer,
  fetchSendVintageScoutResponse,
  fetchFinishVintageScoutTrainer,
} from '../ai-courses-thunks/vintageScoutThunks.js';

const buildVintageScoutCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START VINTAGE SCOUT TRAINER
       ========================================== */
    .addCase(fetchStartVintageScoutTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
      state.aiChat.error = null;
    })
    .addCase(fetchStartVintageScoutTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'active';
      state.aiChat.preview = action.payload.preview;
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }
      ];
    })
    .addCase(fetchStartVintageScoutTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер Винтажный раритет';
    })

    /* ==========================================
       💬 FETCH SEND VINTAGE SCOUT RESPONSE
       ========================================== */
    .addCase(fetchSendVintageScoutResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchSendVintageScoutResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      const { answer, isPitchFinished, user_transcript } = action.payload;

      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        });
      }

      if (isPitchFinished) {
        state.aiChat.aiStatus = 'ready_to_finish'; // Рендерит кнопку "Узнать реальное состояние раритета"
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        });
        state.aiChat.aiStatus = 'active';
      }
    })
    .addCase(fetchSendVintageScoutResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop();
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа продавцу';
    })

    /* ==========================================
       🏆 FETCH FINISH VINTAGE SCOUT TRAINER
       ========================================== */
    .addCase(fetchFinishVintageScoutTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchFinishVintageScoutTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'finished'; // Экран аналитики
      
      state.status = action.payload.status || 'active';
      state.progressData = action.payload.progressData;
      state.currentBlockIndex = action.payload.currentBlockIndex;
      
      // Набор критериев: { totalScore, feedback, criteria: { openQuestions, trustBuilding }, isScoreCounted }
      state.aiChat.verdict = action.payload.evaluation;
    })
    .addCase(fetchFinishVintageScoutTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Ошибка получения вердикта продавца';
    });
};

export default buildVintageScoutCases;
