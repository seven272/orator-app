import React from 'react';
import styles from './ChallengeForm.module.css';

const ChallengeForm = ({ 
  instruction, 
  reportText, 
  setReportText, 
  onSubmit, 
  onCancel, 
  isLoading 
}) => {
  const characterCount = reportText.trim().length;

  return (
    <div className={styles.form_zone}>
      <div className={styles.divider} />
      <p className={styles.instruction}>
        <strong>Задание:</strong> {instruction}
      </p>
      
      <textarea
        className={styles.textarea}
        placeholder="Напиши сюда свой подробный отчет о выполнении (например: где проводил, с кем говорил, что получилось)..."
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        rows={3}
        disabled={isLoading}
      />
      
      {/* Визуальный счетчик символов */}
      <div className={styles.char_counter}>
        Символов: <span className={characterCount < 15 ? styles.counter_red : styles.counter_green}>{characterCount}</span> / минимум 15
      </div>

      <div className={styles.btn_group}>
        <button
          className={styles.submit_btn}
          onClick={onSubmit}
          disabled={isLoading || characterCount < 15}
        >
          {isLoading ? 'Отправка...' : 'Подтвердить выполнение'}
        </button>
        <button
          className={styles.cancel_btn}
          onClick={onCancel}
          disabled={isLoading}
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default ChallengeForm;
