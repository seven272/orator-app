import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';

import {
  fetchChallenges,
  fetchSubmitChallengeReport,
  resetChallengesState,
} from '../../../redux/slices/challengeSlice';
import ChallengeCard from './challenge-card/ChallengeCard';
import styles from './Challenges.module.css';

const Challenges = () => {
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const isAuthenticated = !!user;

  const { list: challenges, status, submitStatus } = useSelector((state) => state.challenge);

  useEffect(() => {
    dispatch(fetchChallenges());
    return () => {
      dispatch(resetChallengesState());
    };
  }, [dispatch]);

  const handleSubmitReport = async (challengeId, textReport) => {
    try {
      await dispatch(fetchSubmitChallengeReport({ challengeId, textReport })).unwrap();
      message.success('Отчет успешно отправлен');
      return true; // Флаг успешности для карточки
    } catch (error) {
      message.error(error?.message || 'Ошибка отправки отчета');
      return false;
    }
  };

  if (status === 'loading') {
    return <div className={styles.loader}>Загрузка испытаний реального мира...</div>;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🔥 Испытания в бою</h2>
      <p className={styles.subtitle}>
        Закрепи полученные навыки в реальной жизни и получи награду
      </p>

      <div className={styles.list}>
        {challenges.map((ch) => (
          <ChallengeCard
            key={ch.id || ch._id}
            challenge={ch}
            isAuthenticated={isAuthenticated}
            onSubmitReport={handleSubmitReport}
            submitStatus={submitStatus}
          />
        ))}
      </div>
    </div>
  );
};

export default Challenges;
