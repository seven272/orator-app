import React, { useState } from 'react';
import { message } from 'antd';

import { validateReportText } from '../../../../utils/validateChallengeReportText';
import ChallengeForm from './challenge-form/ChallengeForm';
import styles from './ChallengeCard.module.css';

const ChallengeCard = ({ challenge, isAuthenticated, onSubmitReport, submitStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [reportText, setReportText] = useState('');

  const isCompleted = challenge.status === 'completed';

  const handleOpenClick = () => {
    if (!isAuthenticated) {
      message.warning('Войдите в аккаунт, чтобы принимать вызовы и получать награды!');
      return;
    }
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    setReportText('');
  };

  const handleSubmit = async () => {
    // 🔔 Наша встроенная защита от бреда
    const validationError = validateReportText(reportText);
    if (validationError) {
      message.error(validationError);
      return;
    }

    const success = await onSubmitReport(challenge.id, reportText);
    if (success) {
      setIsOpen(false);
      setReportText('');
    }
  };

  return (
    <div className={`${styles.card} ${isCompleted ? styles.card_completed : ''}`}>
      <div className={styles.card_header}>
        <span className={styles.skill_badge}>{challenge.targetSkill}</span>
        <span className={styles.reward_badge}>🎁 +{challenge.reward?.xp} XP</span>
      </div>

      <h3 className={styles.card_title}>{challenge.title}</h3>
      <p className={styles.card_description}>{challenge.description}</p>

      {isCompleted ? (
        <div className={styles.completed_label}>✅ Выполнено! Отчет отправлен.</div>
      ) : (
        <>
          {!isOpen ? (
            <button className={styles.action_button} onClick={handleOpenClick}>
              Принять вызов
            </button>
          ) : (
            <ChallengeForm
              instruction={challenge.instruction || challenge.verificationInstruction}
              reportText={reportText}
              setReportText={setReportText}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={submitStatus === 'loading'}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ChallengeCard;
