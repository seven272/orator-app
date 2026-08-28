import {
  fetchStartFamilyMinefieldTrainer,
  fetchSendFamilyMinefieldResponse,
  fetchFinishFamilyMinefieldTrainer,
} from '../ai-courses-thunks/familyMinefieldThunks.js';

const buildFamilyMinefieldCases = (builder) => {
  builder
    /* ==========================================
       🎯 FETCH START FAMILY MINEFIELD TRAINER
       ========================================== */
    .addCase(fetchStartFamilyMinefieldTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
      state.aiChat.error = null;
    })
    .addCase(fetchStartFamilyMinefieldTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'active';
      state.aiChat.preview = action.payload.preview;
      state.aiChat.messages = [
        { role: 'assistant', text: action.payload.question }
      ];
    })
    .addCase(fetchStartFamilyMinefieldTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Не удалось запустить тренажер Семейное минное поле';
    })

    /* ==========================================
       💬 FETCH SEND FAMILY MINEFIELD RESPONSE
       ========================================== */
    .addCase(fetchSendFamilyMinefieldResponse.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchSendFamilyMinefieldResponse.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      const { answer, isPitchFinished, user_transcript } = action.payload;

      if (user_transcript) {
        state.aiChat.messages.push({
          role: 'user',
          text: user_transcript,
        });
      }

      if (isPitchFinished) {
        state.aiChat.aiStatus = 'ready_to_finish'; // Рендерит кнопку вердикта семейного совета
      } else {
        state.aiChat.messages.push({
          role: 'assistant',
          text: answer,
        });
        state.aiChat.aiStatus = 'active';
      }
    })
    .addCase(fetchSendFamilyMinefieldResponse.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      if (state.aiChat.messages.at(-1)?.role === 'user') {
        state.aiChat.messages.pop();
      }
      state.aiChat.error = action.payload || 'Ошибка отправки ответа родственнику';
    })

    /* ==========================================
       🏆 FETCH FINISH FAMILY MINEFIELD TRAINER
       ========================================== */
    .addCase(fetchFinishFamilyMinefieldTrainer.pending, (state) => {
      state.aiChat.chatStatus = 'loading';
    })
    .addCase(fetchFinishFamilyMinefieldTrainer.fulfilled, (state, action) => {
      state.aiChat.chatStatus = 'succeeded';
      state.aiChat.aiStatus = 'finished'; // Экран аналитики
      
      state.status = action.payload.status || 'active';
      state.progressData = action.payload.progressData;
      state.currentBlockIndex = action.payload.currentBlockIndex;
      
      // Набор критериев: { totalScore, feedback, criteria: { emotionalControl, topicShift }, isScoreCounted }
      state.aiChat.verdict = action.payload.evaluation;
    })
    .addCase(fetchFinishFamilyMinefieldTrainer.rejected, (state, action) => {
      state.aiChat.chatStatus = 'failed';
      state.aiChat.error = action.payload || 'Ошибка получения вердикта семейного совета';
    });
};

export default buildFamilyMinefieldCases;
