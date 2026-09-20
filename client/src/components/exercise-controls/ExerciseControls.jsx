// components/exercise-controls/ExerciseControls.jsx
import React, { useState, useMemo } from 'react';
import {
  IoMdArrowRoundBack,
  IoMdArrowRoundForward,
} from 'react-icons/io';
import { FaCheck } from 'react-icons/fa';
import { ShareAltOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { message } from 'antd';

import {
  checkIsAuth,
  checkIsVkGuest,
} from '../../redux/slices/authSlice';
import {
  openGuestOffer,
  openPremiumOffer,
} from '../../redux/slices/exerciseSlice';

// Импортируем конфигурационный массив со структурой всех тренажеров
import { ALL_EXERCISES } from '../../assets/mocks/exercises';
import { useVkEnvironment } from '../../hooks/useVkEnvironment';
import { shareExerciseResultToStory } from '../../utils/vkShareStory';
import styles from './ExerciseControls.module.css';

const SCORING_DATA = {
  LEVEL_1: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 15 },
    { label: 'Уверенно', value: 30 },
  ],
  LEVEL_2: [
    { label: 'Плохо', value: 5 },
    { label: 'Нормально', value: 25 },
    { label: 'Уверенно', value: 50 },
  ],
};

const ExerciseControls = ({
  status,
  exAlias, // Передаем только текстовый алиас тренажера
  STATUS,
  xp,
  isTaskInterrupted,
  onStart,
  onStop,
  onComplete,
  onRate,
  onFinish,
  onNext,
}) => {
  const dispatch = useDispatch();
  const [isSharing, setIsSharing] = useState(false);
  const isVkEnvironment = useVkEnvironment();
  
  const { user: profileUser } = useSelector((state) => state.profile);
  const isAuth = useSelector(checkIsAuth);
  const isVkGuest = useSelector(checkIsVkGuest);
  
  const isGuest = !isAuth || isVkGuest;

  // 🛠️ Находим объект текущего тренажера с использованием сглаживания Object.values().flat()
  const currentExercise = useMemo(() => {
    if (!exAlias) return null;
    return Object.values(ALL_EXERCISES)
      .flat()
      .find((ex) => ex?.alias === exAlias);
  }, [exAlias]);

  // Высчитываем уровень и стоимость энергии на основе найденного объекта
  const exerciseLevel = currentExercise?.level || 1;
  const cost = exerciseLevel === 2 ? 2 : 1;
  const targetLevelKey = `LEVEL_${exerciseLevel}`;

  const handleStart = () => {
    if (isGuest) {
      const currentEnergy = localStorage.getItem('govorix_guest_energy')
        ? parseInt(localStorage.getItem('govorix_guest_energy'), 10)
        : 3;

      if (currentEnergy < cost) {
        dispatch(openGuestOffer());
        return;
      }
      onStart();
      return;
    }

    if (profileUser?.isPremium) {
      onStart();
      return;
    }

    const allowed = profileUser?.dailyEnergy?.allowed ?? 15;
    const used = profileUser?.dailyEnergy?.used ?? 0;
    const availableEnergy = Math.max(0, allowed - used);

    if (availableEnergy < cost) {
      dispatch(openPremiumOffer());
      return;
    }

    onStart();
  };

  const handleShareStory = async () => {
    if (!currentExercise || isSharing) return;
    setIsSharing(true);
    message.loading({ content: 'Формируем карточку...', key: 'storyVkKey' });

    const result = await shareExerciseResultToStory(currentExercise);

    if (result && result.success) {
      message.success({ content: 'История успешно добавлена!', key: 'storyVkKey', duration: 3 });
    } else {
      message.error({ content: 'Не удалось опубликовать историю', key: 'storyVkKey', duration: 3 });
    }
    setIsSharing(false);
  };

  return (
    <div className={styles.btns_wrap}>
      {/* Кнопка Старт */}
      {status === STATUS.IDLE && (
        <button className={styles.btn_start} onClick={handleStart}>
          Начать задание
        </button>
      )}

      {/* Кнопки во время выполнения */}
      {status === STATUS.RUNNING && (
        <div className={styles.btns_finished_wrap}>
          <button type="button" className={styles.btn_stop} onClick={onStop}>
            Прервать
          </button>
          <button type="button" className={styles.btn_ready} onClick={onComplete}>
            Готово
            <FaCheck size={12} />
          </button>
        </div>
      )}

      {/* Блок ручной самооценки */}
      {status === STATUS.FINISHED && xp === 0 && !isTaskInterrupted && (
        <div className={styles.btns_finished_wrap}>
          {SCORING_DATA[targetLevelKey]?.map((option) => (
            <button
              key={option.value}
              onClick={() => onRate(option.value)}
              className={styles.btn_rate}
            >
              <span>{option.label}</span>
              <span>{option.value}xp</span>
            </button>
          ))}
        </div>
      )}

      {/* Блок финальной навигации и шеринга */}
      {status === STATUS.FINISHED && (xp !== 0 || isTaskInterrupted) && (
        <div className={styles.btns_end_container}>
          
          {/* Кнопка Истории отображается строго в ВК и только при успешном завершении */}
          {isVkEnvironment && !isTaskInterrupted && (
            <button 
              type="button" 
              className={styles.btn_vk_story}
              onClick={handleShareStory}
              disabled={isSharing}
            >
              <ShareAltOutlined size={16} />
              Поделиться успехом в Истории
            </button>
          )}

          <div className={styles.btns_finished_wrap}>
            <button className={styles.btn_end} onClick={onFinish}>
              <IoMdArrowRoundBack size={18} />
              Закончить
            </button>
            <button className={styles.btn_next} onClick={onNext}>
              Продолжить
              <IoMdArrowRoundForward size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseControls;
