import mongoose from 'mongoose'
import Course from '../models/Course.js'
import dotenv from 'dotenv'

dotenv.config()

// 💡 ТЕПЕРЬ ЭТО МАССИВ: Сюда вы можете добавлять сколько угодно курсов по шаблону
const COURSES_TO_SEED = [
  {
    courseCode: 'pitch_master',
    title: 'Питч на миллион: Как презентовать идею',
    description:
      'Курс-интенсив по жесткой аргументации, логике публичных выступлений и продаже проектов инвесторам за 3 минуты.',
    // В новой модели полей targetSkill и priceCoins на верхнем уровне нет,
    // но если они вам нужны в будущем, добавьте их в схему. В текущей схеме Course.js их убрали.
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Анатомия идеального питча',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Ровно один правильный ответ (текст вопроса и вариантов — на фронте)
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Скоростной воркаут аргументации',
        aiWorkoutConfig: {
          // Связь с workoutConfigs.js на фронтенде. Пользователь проходит доступные тренажеры,
          // пока в накопительную копилку бэкенда не упадет суммарно 1000 баллов.
          workoutConfigIds: ['investor_pitch', 'objection_handler'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выход в реальность (Боевое крещение)',
        irlChallengeConfig: {
          description:
            'Презентовать свою текущую рабочую идею, проект или хобби по формуле «Проблема -> Решение -> Деньги» строго за 60 секунд.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен «Жесткий Инвестор»',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  {
    courseCode: 'hr_storm',
    title: 'HR-Штурм: Искусство собеседований',
    description:
      'Пошаговый интенсив по прохождению интервью. Избавитесь от страха перед рекрутерами, научитесь отвечать на неудобные вопросы и продавать свой опыт на 30% дороже рынка.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Стратегия успешного интервью',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Правильный ответ на вопрос о самопрезентации по STAR
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Интерактивный HR-баттл',
        aiWorkoutConfig: {
          // 💡 Два тренажёра на одном шаге! Проходятся в любом порядке
          workoutConfigIds: ['hr_screener', 'stress_interview'],
          requiredScore: 1000, // Нужно набрать суммарно 1000 баллов в обоих тренажёрах
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выход на реальный рынок',
        irlChallengeConfig: {
          description:
            'Откликнуться на 3 открытые вакансии на профильном сайте и получить как минимум один письменный или устный ответ от рекрутера.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Голосовой монолог)',
        examConfig: {
          minScoreToPass: 85, // Промпт оценки на бэке будет требовать связный рассказ на 60-120 сек
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  {
    courseCode: 'self_pitch_pro',
    title: 'Личный бренд: Самопрезентация на миллион',
    description:
      'Практикум по созданию сильного экспертного образа. Научитесь за 90 секунд доносить свою ценность до VIP-клиентов и партнеров без хвастовства и синдрома самозванца.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Формула идеального личного питча',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 2, // Правильный ответ на квиз по структуре нетворкинга
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Воркаут на бизнес-конференции',
        aiWorkoutConfig: {
          // 💡 Два тренажёра для прокачки нетворкинга и лифта
          workoutConfigIds: ['elevator_pitch', 'networking_expert'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Боевое знакомство',
        irlChallengeConfig: {
          description:
            'Написать в профильный профессиональный чат или познакомиться вживую с 2 экспертами, применив отработанную формулу самопрезентации.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Голосовой монолог)',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },
  {
    courseCode: 'party_charisma',
    title: 'Харизма нетворкинга: Свой в любой компании',
    description:
      'Практическое руководство по непринужденному общению. Избавитесь от страха подходить к незнакомцам, освоите искусство Small Talk и научитесь заводить полезные контакты на вечеринках, выставках и неформальных мероприятиях.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Психология легкого общения',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Соответствует второму варианту (стратегия ожидания и контекста)
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Практика в эпицентре событий',
        aiWorkoutConfig: {
          workoutConfigIds: ['bar_small_talk', 'vip_afterparty'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выход в свет',
        irlChallengeConfig: {
          description:
            'Посетить офлайн-мероприятие или популярный бар, применить формулу Small Talk минимум к двум незнакомым людям и обменяться контактами.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Голосовая визитка)',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },
  {
    courseCode: 'social_shield',
    title: 'Психологический щит: Ответ на агрессию и манипуляции',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Психология самообороны в диалоге',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Индекс правильного ответа (второй вариант)
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Психологический полигон',
        aiWorkoutConfig: {
          workoutConfigIds: ['toxic_relative', 'street_rudeness'],
          requiredScore: 1000, // Накопительный порог для двух тренажёров
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Проверка границ на практике',
        irlChallengeConfig: {
          description:
            'Применение техник «Амортизация», «Испорченная пластинка» или «Стоп-сигнал» при первой же реальной попытке нарушить ваши границы в быту или на работе.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Голосовой тест)',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  /* ==========================================================================
     🎙️ КУРС 6: Оратор в кадре: Магия публичных выступлений
     ========================================================================== */
  {
    courseCode: 'media_speaker',
    title: 'Оратор в кадре: Магия публичных выступлений',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Законы удержания аудитории',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Индекс правильного ответа (второй вариант)
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Интерактивная трибуна',
        aiWorkoutConfig: {
          workoutConfigIds: ['troll_handler', 'time_limit_pitch'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выступление перед людьми',
        irlChallengeConfig: {
          description:
            'Запись короткого видео (рилс/кружок в Telegram) до 2 минут или живое выступление на планерке перед коллегами с использованием правил удержания внимания.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Вдохновляющий спич)',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  /* ==========================================================================
     🥂 КУРС 7: Король застолья: Искусство тостов и ярких речей
     ========================================================================== */
  {
    courseCode: 'toast_master',
    title: 'Король застолья: Искусство тостов и ярких речей',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Конструктор идеального тоста',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Индекс правильного ответа (второй вариант)
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Праздничный микрофон',
        aiWorkoutConfig: {
          workoutConfigIds: ['impromptu_toast', 'wedding_challenge'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Праздничная практика',
        irlChallengeConfig: {
          description:
            'Инициативное выступление с тостом на ближайшем семейном ужине, встрече с друзьями или корпоративе по формуле Зачин ➔ Метафора ➔ Пожелание.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен (Главный тост вечера)',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },
  {
    courseCode: 'story_master',
    title: 'Магия истории: искусство увлекательного рассказа',
    description:
      'Практический курс по созданию сильных историй для выступлений, рабочих задач и повседневной жизни. Изучите законы драматургии для удержания внимания.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Архитектура сильного повествования',
        theoryConfig: {
          quiz: {
            // Соответствует второму варианту в созданном нами QUIZ_STORY_MASTER (индекс 1)
            correctAnswerIndex: 1,
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Речевой полигон историй',
        aiWorkoutConfig: {
          // Идентификаторы двух созданных нами тренажеров для связи с фронтендом
          workoutConfigIds: ['hero_journey', 'fiasco_turn'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Живой рассказ на публике',
        irlChallengeConfig: {
          description:
            'Применить изученную четырехшаговую формулу живого повествования во время реального общения с коллегами, друзьями или в видеосообщении.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен «Вдохновляющая речь»',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },
  // =========================================================================
  // КУРС 9: СИЛА КОМПЛИМЕНТА (compliment_pro)
  // =========================================================================
  {
    courseCode: 'compliment_pro',
    title: 'Сила комплимента: искусство располагать к себе',
    description:
      'Практикум по созданию мгновенного доверия в реальной жизни. Научитесь говорить искренние комплименты без лести, подмечать неочевидные детали и экологично влиять на атмосферу в любом окружении.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Анатомия искренней похвалы',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 2, // Соответствует третьему варианту в QUIZ_COMPLIMENT_PRO
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Интерактивный ИИ-ринг эмпатии',
        aiWorkoutConfig: {
          workoutConfigIds: ['empathy_spark', 'anti_flattery'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выход в реальность (Комплимент действию)',
        irlChallengeConfig: {
          description:
            'Сделать за день 3 осознанных комплимента разным людям из вашего окружения или случайным прохожим, оценивая их выбор, усилия или экспертные действия.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен «Мост к кумиру»',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  // =========================================================================
  // КУРС 10: ИСКУССТВО ОТВЕТОВ НА ВОПРОСЫ (qa_master)
  // =========================================================================
  {
    courseCode: 'qa_master',
    title: 'Искусство ответов: как не теряться на публике',
    description:
      'Развитие скорости речевого мышления. Научитесь мгновенно группироваться, выигрывать время на размышление и уверенно отвечать на неожиданные или бестактные вопросы в реальной жизни.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Теория реактивного ответа',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 1, // Индекс правильного ответа для квиза ответов на бэкенде
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Интерактивный ИИ-ринг экспромта',
        aiWorkoutConfig: {
          workoutConfigIds: ['taxi_blitz', 'family_minefield'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title: '🎯 Блок 3: Выход в реальность (Речевая растяжка)',
        irlChallengeConfig: {
          description:
            'Применить технику фиксации и осознанную паузу в 2 секунды перед ответом на любой бытовой или рабочий вопрос, чтобы сделать речь весомее.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен «Внезапный микрофон»',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },

  // =========================================================================
  // КУРС 11: МАСТЕР ВОПРОСОВ (question_architect)
  // =========================================================================
  {
    courseCode: 'question_architect',
    title: 'Мастер вопросов: как управлять беседой',
    description:
      'Тот, кто задает вопросы, управляет диалогом. Освойте воронку вопросов, научитесь мягко перехватывать инициативу у болтливых людей и собирать скрытую информацию.',
    blocks: [
      {
        blockType: 'theory',
        title: '📖 Блок 1: Архитектура сильных вопросов',
        theoryConfig: {
          quiz: {
            correctAnswerIndex: 2, // Индекс правильного ответа для квиза вопросов на бэкенде
          },
        },
      },
      {
        blockType: 'ai_workout',
        title: '🤖 Блок 2: Интерактивный ИИ-ринг стратегии',
        aiWorkoutConfig: {
          workoutConfigIds: ['vintage_scout', 'deaf_passenger'],
          requiredScore: 1000,
        },
      },
      {
        blockType: 'irl_challenge',
        title:
          '🎯 Блок 3: Выход в реальность (Диалог без утверждений)',
        irlChallengeConfig: {
          description:
            'Провести пятиминутный разговор с приятелем или знакомым, используя исключительно вопросительные предложения по методу коммуникационной воронки.',
        },
      },
      {
        blockType: 'exam',
        title: '🎓 Блок 4: Финальный экзамен «Разведка на новоселье»',
        examConfig: {
          minScoreToPass: 85,
        },
      },
    ],
    rewards: {
      xp: 1000,
      coins: 100,
      achievementCode: 'course_master',
    },
  },
]

// Функция подключения к БД и массового сохранения курсов
const seedCourses = async () => {
  const MONGO_URI =
    process.env.MONGO_URI || 'mongodb://localhost:27017/your_app_db'

  try {
    // Подключаемся без устаревших опций (в новых версиях драйвера они дефолтные)
    await mongoose.connect(MONGO_URI)
    console.log('Успешное подключение к MongoDB.')

    // Итерируемся по массиву и обновляем каждый курс
    for (const courseData of COURSES_TO_SEED) {
      await Course.findOneAndUpdate(
        { courseCode: courseData.courseCode },
        courseData,
        { upsert: true, new: true },
      )
      console.log(
        `✅ Курс '${courseData.title}' (${courseData.courseCode}) успешно добавлен/обновлен в БД.`,
      )
    }

    console.log(
      '\n🎉 Сидирование базы данных курсов успешно завершено!',
    )
  } catch (error) {
    console.error('❌ Ошибка при сидировании базы данных:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Сессия MongoDB закрыта.')
  }
}

seedCourses()
