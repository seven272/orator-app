// src/config/workoutConfigs.js

import * as pitchThunks from '../../../../redux/slices/ai-courses-thunks/pitchThunks'
import * as objectionThunks from '../../../../redux/slices/ai-courses-thunks/objectionThunks'
import * as networkingThunks from '../../../../redux/slices/ai-courses-thunks/networkingThunks'
import * as vipCloseThunks from '../../../../redux/slices/ai-courses-thunks/vipCloseThunks'
import * as hrScreenerThunks from '../../../../redux/slices/ai-courses-thunks/hrScreenerThunks'
import * as stressInterviewThunks from '../../../../redux/slices/ai-courses-thunks/stressInterviewThunks'
import * as barSmallTalkThunks from '../../../../redux/slices/ai-courses-thunks/barSmallTalkThunks'
import * as vipAfterpartyThunks from '../../../../redux/slices/ai-courses-thunks/vipAfterpartyThunks'
import * as toxicRelativeThunks from '../../../../redux/slices/ai-courses-thunks/toxicRelativeThunks.js'
import * as streetRudenessThunks from '../../../../redux/slices/ai-courses-thunks/streetRudenessThunks.js'
import * as trollHandlerThunks from '../../../../redux/slices/ai-courses-thunks/trollHandlerThunks'
import * as timeLimitPitchThunks from '../../../../redux/slices/ai-courses-thunks/timeLimitPitchThunks'
import * as impromptuToastThunks from '../../../../redux/slices/ai-courses-thunks/impromptuToastThunks'
import * as weddingChallengeThunks from '../../../../redux/slices/ai-courses-thunks/weddingChallengeThunks'
import * as heroJourneyThunks from '../../../../redux/slices/ai-courses-thunks/heroJourneyThunks'
import * as fiascoTurnThunks from '../../../../redux/slices/ai-courses-thunks/fiascoTurnThunks'
import * as empathySparkThunks from '../../../../redux/slices/ai-courses-thunks/empathySparkThunks'
import * as antiFlatteryThunks from '../../../../redux/slices/ai-courses-thunks/antiFlatteryThunks'
import * as taxiBlitzThunks from '../../../../redux/slices/ai-courses-thunks/taxiBlitzThunks'
import * as familyMinefieldThunks from '../../../../redux/slices/ai-courses-thunks/familyMinefieldThunks'
import * as vintageScoutThunks from '../../../../redux/slices/ai-courses-thunks/vintageScoutThunks'
import * as deafPassengerThunks from '../../../../redux/slices/ai-courses-thunks/deafPassengerThunks'

// Собираем все санки в единый объект для динамического вызова по ключу
export const ALL_WORKOUT_THUNKS = {
  ...pitchThunks,
  ...objectionThunks,
  ...networkingThunks,
  ...vipCloseThunks,
  ...hrScreenerThunks,
  ...stressInterviewThunks,
  ...barSmallTalkThunks,
  ...vipAfterpartyThunks,
  ...toxicRelativeThunks,
  ...streetRudenessThunks,
  ...trollHandlerThunks,
  ...timeLimitPitchThunks,
  ...impromptuToastThunks,
  ...weddingChallengeThunks,
  ...heroJourneyThunks,
  ...fiascoTurnThunks,
  ...empathySparkThunks,
  ...antiFlatteryThunks,
  ...taxiBlitzThunks,
  ...familyMinefieldThunks,
  ...vintageScoutThunks,
  ...deafPassengerThunks,
}

export const WORKOUT_CONFIGS = {
  investor_pitch: {
    id: 'investor_pitch',
    title: '🤖 Питч-сессия с жестким инвестором',
    description:
      'Симуляция встречи с венчурным фондом. ИИ будет перебивать, задавать неудобные вопросы о юнит-экономике.',
    badge: 'Венчурный созвон / Питч',
    thunks: {
      start: 'fetchStartPitchTrainer',
      send: 'fetchSendPitchResponse',
      finish: 'fetchFinishPitchTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Голосовой питч)',
      aiRoleName: 'Инвестор',
      thinkingText: '⏳ Инвестор слушает и думает...',
      finishText:
        '🗣️ Диалог подошел к концу. Инвестор готов выставить оценку.',
      finishButtonText: 'Получить вердикт инвестора',
      finishButtonLoadingText: 'Анализ питча нейросетью...',
    },
    criteria: [
      { key: 'structure', label: 'Структура' },
      { key: 'persuasion', label: 'Убедительность' },
    ],
  },
  objection_handler: {
    id: 'objection_handler',
    title: '🔥 Минное поле: Отработка возражений',
    description:
      'Вам противостоит разгневанный, экономный или скептичный клиент. Спасите сделку и удержите позиции без оправданий.',
    badge: 'Кризисные переговоры / B2B',
    thunks: {
      start: 'fetchStartObjectionTrainer',
      send: 'fetchSendObjectionResponse',
      finish: 'fetchFinishObjectionTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Работа с возражениями)',
      aiRoleName: 'Клиент',
      thinkingText: '⏳ Клиент формулирует ответ...',
      finishText:
        '🗣️ Переговоры завершены. Клиент принимает финальное решение.',
      finishButtonText: 'Узнать вердикт клиента',
      finishButtonLoadingText: 'Анализ диалога экспертом...',
    },
    criteria: [
      { key: 'empathy', label: 'Эмпатия' },
      { key: 'argumentation', label: 'Аргументация' },
    ],
  },
  networking_expert: {
    id: 'networking_expert',
    title: '🤝 Нетворкинг-мастер: бизнес-знакомство',
    description:
      'Вы на профильной конференции. Вокруг сотни экспертов и заказчиков. Ваша задача — уверенно подойти, познакомиться, кратко донести свою ценность по формуле "Польза + Кейс" и договориться о созвоне.',
    badge: 'Бизнес-знакомство / Нетворкинг',
    thunks: {
      start: 'fetchStartNetworking',
      send: 'fetchSendNetworkingResponse',
      finish: 'fetchFinishNetworking',
    },
    ui: {
      sessionLabel: 'Диалог на конференции',
      aiRoleName: 'Эксперт / Заказчик',
      thinkingText: '⏳ Собеседник отвечает...',
      finishText:
        '🗣️ Обмен контактами завершен. Собеседник оценивает ваш профессионализм.',
      finishButtonText: 'Посмотреть разбор знакомства',
      finishButtonLoadingText: 'Экспертный анализ диалога...',
    },
    criteria: [
      {
        key: 'positioning',
        label: 'Позиционирование (Ваша ценность)',
      },
      {
        key: 'callToAction',
        label: 'Призыв к действию (Оффер/Контакты)',
      },
    ],
  },
  vip_client_close: {
    id: 'vip_client_close',
    title: '👑 Встреча на миллион: закрытие VIP-клиента',
    description:
      'Плотный деловой созвон или встреча в ресторане с потенциальным крупным заказчиком. Он выделил вам 5 минут. Задача — презентовать себя через кейсы, выявить его главную боль и закрыть на полноценный аудит/консалтинг.',
    badge: 'Закрытие сделки / VIP',
    thunks: {
      start: 'fetchStartVipClose',
      send: 'fetchSendVipResponse',
      finish: 'fetchFinishVipClose',
    },
    ui: {
      sessionLabel: 'Деловые переговоры с VIP',
      aiRoleName: 'Потенциальный заказчик',
      thinkingText: '⏳ Заказчик оценивает ваше предложение...',
      finishText:
        '🗣️ Встреча подошла к концу. Клиент принимает решение по следующему шагу.',
      finishButtonText: 'Посмотреть разбор переговоров',
      finishButtonLoadingText:
        'Нейросеть сканирует ваши аргументы...',
    },
    criteria: [
      {
        key: 'usp',
        label: 'УТП (Понятно ли ваше отличие от конкурентов)',
      },
      {
        key: 'painFocus',
        label:
          'Фокус на боли (Насколько питч попал в проблему клиента)',
      },
    ],
  },
  hr_screener: {
    id: 'hr_screener',
    title: '📞 Первичный HR-скрининг: Чат-интервью',
    description:
      'Симуляция первого созвона с рекрутером. ИИ будет проверять вашу адекватность, базовые софт-скиллы и соответствие резюме.',
    badge: 'Чат-интервью / Скрининг',
    thunks: {
      start: 'fetchStartHrScreener',
      send: 'fetchSendHrScreenerResponse',
      finish: 'fetchFinishHrScreener',
    },
    ui: {
      sessionLabel: 'Первичный скрининг (Голосовое интервью)',
      aiRoleName: 'HR-Рекрутер',
      thinkingText: '⏳ Рекрутер делает пометки в резюме...',
      finishText:
        '🗣️ Первичный созвон окончен. Рекрутер формирует фидбэк для нанимающего менеджера.',
      finishButtonText: 'Посмотреть отчет рекрутера',
      finishButtonLoadingText: 'ИИ анализирует ваши софт-скиллы...',
    },
    criteria: [
      {
        key: 'softSkills',
        label: 'Софт-скиллы (Адекватность и самопрезентация)',
      },
      {
        key: 'starStructure',
        label: 'Структура STAR (Логика изложения опыта)',
      },
    ],
  },
  stress_interview: {
    id: 'stress_interview',
    title: '🔥 Стресс-интервью с будущим боссом',
    description:
      'Жесткий разговор с руководителем отдела. ИИ начнет давить, цепляться к пробелам в резюме и детально расспрашивать про ваши факапы.',
    badge: 'Работа под давлением / Стресс-тест',
    thunks: {
      start: 'fetchStartStressInterview',
      send: 'fetchSendStressResponse',
      finish: 'fetchFinishStressInterview',
    },
    ui: {
      sessionLabel: 'Стресс-собеседование (Работа под давлением)',
      aiRoleName: 'Руководитель отдела',
      thinkingText: '⏳ Босс оценивает ваши аргументы...',
      finishText:
        '🗣️ Интервью подошло к концу. Руководитель принимает финальное решение по вашей кандидатуре.',
      finishButtonText: 'Посмотреть разбор стресс-теста',
      finishButtonLoadingText:
        'Нейросеть сканирует вашу стрессоустойчивость...',
    },
    criteria: [
      {
        key: 'stressResistance',
        label:
          'Стрессоустойчивость (Реакция на давление и каверзные вопросы)',
      },
      {
        key: 'reflection',
        label:
          'Рефлексия (Умение признавать и разбирать свои ошибки)',
      },
    ],
  },
  bar_small_talk: {
    id: 'bar_small_talk',
    title: '🍹 Разговор у барной стойки',
    description:
      'Растопите лед в общении с незнакомцем на неформальной вечеринке. Завяжите непринужденный разговор ни о чем и плавно найдите общие темы.',
    badge: 'Неформальный Small Talk',
    thunks: {
      start: 'fetchStartBarSmallTalk',
      send: 'fetchSendBarSmallTalkResponse',
      finish: 'fetchFinishBarSmallTalk',
    },
    ui: {
      sessionLabel: 'Неформальный Small Talk (У стойки бара)',
      aiRoleName: 'Собеседник у бара',
      thinkingText: '⏳ Собеседник делает глоток и отвечает...',
      finishText:
        '🗣️ Легкая беседа завершается. Собеседник оценивает, насколько комфортно и интересно было с вами общаться.',
      finishButtonText: 'Посмотреть анализ Small Talk',
      finishButtonLoadingText:
        'Нейросеть измеряет вашу легкость в общении...',
    },
    criteria: [
      {
        key: 'iceBreaking',
        label:
          'Растапливание льда (Ситуативный старт и естественность)',
      },
      {
        key: 'conversationalFlow',
        label: 'Плавность диалога (Умение слушать и передавать мяч)',
      },
    ],
  },
  vip_afterparty: {
    id: 'vip_afterparty',
    title: '🥂 Закрытое афтерпати лидеров',
    description:
      'Вклиньтесь в закрытый круг топ-менеджеров или инфлюенсеров. Органично заявите о себе без душной экспертности и договоритесь о кофе.',
    badge: 'Харизматичный нетворкинг',
    thunks: {
      start: 'fetchStartVipAfterparty',
      send: 'fetchSendVipAfterpartyResponse',
      finish: 'fetchFinishVipAfterparty',
    },
    ui: {
      sessionLabel: 'Общение на VIP-афтерпати (Высокий статус)',
      aiRoleName: 'VIP-Гость / Лидер мнений',
      thinkingText: '⏳ Собеседник оценивает вашу харизму...',
      finishText:
        '🗣️ Время экспресс-знакомства вышло. Лидеры мнений принимают решение, стоит ли добавлять вас в контакты.',
      finishButtonText: 'Узнать вердикт VIP-круга',
      finishButtonLoadingText:
        'ИИ сканирует ваш харизматический статус...',
    },
    criteria: [
      {
        key: 'charismaStatus',
        label: 'Харизматический статус (Уверенность на равных)',
      },
      {
        key: 'ecologicalExit',
        label:
          'Экологичный выход (Красивый финал и фиксация контакта)',
      },
    ],
  },
  toxic_relative: {
    id: 'toxic_relative',
    title: '👵 Манипуляции близких: Пассивная агрессия',
    description:
      'Очертите жесткие личные границы в разговоре с токсичным родственником или соседом, не скатываясь в чувство вины.',
    badge: 'Личные границы',
    thunks: {
      start: 'fetchStartToxicRelative',
      send: 'fetchSendToxicRelativeResponse',
      finish: 'fetchFinishToxicRelative',
    },
    ui: {
      sessionLabel: 'Семейные границы (Защита от манипуляций)',
      aiRoleName: 'Родственник / Сосед',
      thinkingText: '⏳ Собеседник подбирает аргументы...',
      finishText:
        '🗣️ Разговор подошел к финалу. Собеседник оценивает твердость ваших границ.',
      finishButtonText: 'Посмотреть разбор границ',
      finishButtonLoadingText:
        'ИИ сканирует манипулятивные маркеры...',
    },
    criteria: [
      {
        key: 'stressResistance',
        label: 'Стрессоустойчивость (Выдержка)',
      },
      {
        key: 'reflection',
        label: 'Удержание границ (Отказ без вины)',
      },
    ],
  },
  street_rudeness: {
    id: 'street_rudeness',
    title: '🛑 Жесткое хамство «в поле»',
    description:
      'Примените техники психологического айкидо при столкновении с агрессивным хамом в МФЦ, на парковке или в сфере услуг.',
    badge: 'Конфликтология',
    thunks: {
      start: 'fetchStartStreetRudeness',
      send: 'fetchSendStreetRudenessResponse',
      finish: 'fetchFinishStreetRudeness',
    },
    ui: {
      sessionLabel: 'Бытовой конфликт (Отражение хамства)',
      aiRoleName: 'Агрессивный персонаж',
      thinkingText: '⏳ Хам реагирует на ваше спокойствие...',
      finishText:
        '🗣️ Словесная стычка завершена. Нейросеть оценивает ваше хладнокровие.',
      finishButtonText: 'Посмотреть анализ конфликта',
      finishButtonLoadingText: 'Психологический аудит диалога...',
    },
    criteria: [
      {
        key: 'stressResistance',
        label: 'Стрессоустойчивость (Хладнокровие)',
      },
      { key: 'reflection', label: 'Амортизация конфликта (Айкидо)' },
    ],
  },
  troll_handler: {
    id: 'troll_handler',
    title: '🤬 Отражение троллинга из зала',
    description:
      'Харизматично перехватить инициативу и отбить каверзные или едкие выкрики скептиков во время вашего публичного вебинара.',
    badge: 'Публичные выступления',
    thunks: {
      start: 'fetchStartTrollHandler',
      send: 'fetchSendTrollResponse',
      finish: 'fetchFinishTrollHandler',
    },
    ui: {
      sessionLabel: 'Прямой эфир (Работа с хейтом)',
      aiRoleName: 'Хейтер / Скептик',
      thinkingText: '⏳ Оппонент формулирует едкую реплику...',
      finishText:
        '🗣️ Словесный поединок окончен. Аудитория оценивает ваше доминирование.',
      finishButtonText: 'Посмотреть разбор атаки',
      finishButtonLoadingText: 'Нейросеть сканирует вашу харизму...',
    },
    criteria: [
      { key: 'poiseAndCharisma', label: 'Отражение хейта' },
      { key: 'initiativeTake', label: 'Уверенность' },
    ],
  },
  time_limit_pitch: {
    id: 'time_limit_pitch',
    title: '⏳ Спич в условиях цейтнота',
    description:
      'Уверенно презентовать свой проект перед экспертным комитетом, который постоянно перебивает, и уложиться строго в лимит.',
    badge: 'Питч в цейтноте',
    thunks: {
      start: 'fetchStartTimeLimitPitch',
      send: 'fetchSendTimeLimitResponse',
      finish: 'fetchFinishTimeLimitPitch',
    },
    ui: {
      sessionLabel: 'Защита проекта (Блиц-интервью)',
      aiRoleName: 'Член комитета',
      thinkingText: '⏳ Эксперт перебивает и задает вопрос...',
      finishText:
        '🗣️ Время вышло. Комитет удаляется для подсчета ваших баллов.',
      finishButtonText: 'Посмотреть вердикт комитета',
      finishButtonLoadingText: 'Анализ структуры спича нейросетью...',
    },
    criteria: [
      { key: 'speechLogic', label: 'Логика изложения' },
      { key: 'timeManagement', label: 'Тайм-менеджмент' },
    ],
  },
  impromptu_toast: {
    id: 'impromptu_toast',
    title: '🎤 Внезапное слово на корпоративе',
    description:
      'За 15 секунд сориентироваться, когда ведущий праздника неожиданно передает вам микрофон перед всем руководством.',
    badge: 'Речевой экспромт',

    thunks: {
      start: 'fetchStartImpromptuToast',
      send: 'fetchSendImpromptuResponse',
      finish: 'fetchFinishImpromptuToast',
    },
    ui: {
      sessionLabel: 'Корпоративное застолье (Экспромт)',
      aiRoleName: 'Ведущий вечера',
      thinkingText: '⏳ Зал затихает в ожидании продолжения...',
      finishText:
        '🗣️ Микрофон выключен. Коллеги оценивают ваше остроумие.',
      finishButtonText: 'Посмотреть разбор экспромта',
      finishButtonLoadingText: 'Нейросеть сканирует уровень юмора...',
    },
    criteria: [
      { key: 'reactionSpeed', label: 'Речевая мобилизация' },
      {
        key: 'corporateHumor',
        label: 'Уместность и корпоративный юмор',
      },
    ],
  },
  wedding_challenge: {
    id: 'wedding_challenge',
    title: '🍾 Свадебный тост / Юбилей',
    description:
      'Удержать внимание разношерстной, шумящей или отвлеченной аудитории, связав личную историю с виновником торжества.',
    badge: 'Праздничный сторителлинг',
    thunks: {
      start: 'fetchStartWeddingChallenge',
      send: 'fetchSendWeddingResponse',
      finish: 'fetchFinishWeddingChallenge',
    },
    ui: {
      sessionLabel: 'Праздничный банкет (Работа с залом)',
      aiRoleName: 'Шумный гость / Зал',
      thinkingText: '⏳ Зал реагирует на вашу историю...',
      finishText:
        '🗣️ Бокалы подняты. Гости оценивают душевность вашей речи.',
      finishButtonText: 'Посмотреть разбор тоста',
      finishButtonLoadingText:
        'ИИ анализирует праздничный сторителлинг...',
    },
    criteria: [
      {
        key: 'festiveStorytelling',
        label: 'Праздничный сторителлинг',
      },
      { key: 'crowdEngagement', label: 'Удержание внимания толпы' },
    ],
  },
  hero_journey: {
    id: 'hero_journey',
    title: '🏹 Путь героя: презентация идеи',
    description:
      'Упакуйте свой опыт в классическую структуру повествования, чтобы вдохновить руководство или партнеров.',
    badge: 'Драматургия',
    thunks: {
      start: 'fetchStartHeroJourney',
      send: 'fetchSendHeroJourneyResponse',
      finish: 'fetchFinishHeroJourney',
    },
    ui: {
      sessionLabel: 'Презентация через историю (Влияние)',
      aiRoleName: 'Слушатель / Партнер',
      thinkingText:
        '⏳ Собеседник мысленно примеряет вашу историю на себя...',
      finishText:
        '🗣️ Рассказ завершен. Руководство оценивает логику и вдохновляющий потенциал вашей истории.',
      finishButtonText: 'Посмотреть разбор структуры',
      finishButtonLoadingText:
        'Нейросеть сканирует законы драматургии...',
    },
    criteria: [
      {
        key: 'dramaturgyStructure',
        label: 'Структура повествования (Динамика)',
      },
      {
        key: 'emotionalHook',
        label: 'Смысловой крючок (Удержание внимания)',
      },
    ],
  },
  fiasco_turn: {
    id: 'fiasco_turn',
    title: '💎 Из провала в триумф',
    description:
      'Расскажите о своей самой жесткой ошибке так, чтобы вызвать уважение и доказать свою зрелость.',
    badge: 'Управление уязвимостью',
    thunks: {
      start: 'fetchStartFiascoTurn',
      send: 'fetchSendFiascoTurnResponse',
      finish: 'fetchFinishFiascoTurn',
    },
    ui: {
      sessionLabel: 'Исповедь лидера (Завоевание доверия)',
      aiRoleName: 'Недоверчивый инвестор',
      thinkingText: '⏳ Инвестор ищет фальшь в ваших словах...',
      finishText:
        '🗣️ Диалог окончен. Слушатель принимает решение, можно ли иметь с вами дело после таких кризисов.',
      finishButtonText: 'Посмотреть анализ искренности',
      finishButtonLoadingText:
        'ИИ измеряет уровень психологической зрелости...',
    },
    criteria: [
      {
        key: 'vulnerabilityBalance',
        label: 'Уровень искренности (Без самобичевания)',
      },
      {
        key: 'lessonExtracted',
        label: 'Выводы из кризиса (Трансформация в плюс)',
      },
    ],
  },
  // ==========================================
  // КУРС: СИЛА КОМПЛИМЕНТА (compliment_pro)
  // ==========================================
  empathy_spark: {
    id: 'empathy_spark',
    title: '✨ Искра доверия',
    description:
      'Растопить лед в общении с закрытым, уставшим незнакомцем, точно подметив деталь его образа или поведения.',
    badge: 'Первое впечатление',
    thunks: {
      start: 'fetchStartEmpathySparkTrainer',
      send: 'fetchSendEmpathySparkResponse',
      finish: 'fetchFinishEmpathySparkTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Живой экспромт)',
      // 🔥 Роль теперь динамическая! Берем из выбранного сценария: exerciseData.role
      aiRoleName: 'Собеседник',
      thinkingText: '⏳ Собеседник слушает вас и думает...',
      finishText:
        '🗣️ Диалог завершен. Собеседник анализирует ваше влияние на его настроение.',
      finishButtonText: 'Узнать вердикт собеседника',
      finishButtonLoadingText: 'Анализ эмпатии нейросетью...',
    },
    criteria: [
      { key: 'observation', label: 'Наблюдательность' },
      { key: 'relevance', label: 'Уместность' },
    ],
  },
  anti_flattery: {
    id: 'anti_flattery',
    title: '🔥 Тонкая грань',
    description:
      'Похвалить близкого человека за его творчество или личные усилия так, чтобы обойти банальные дежурные фразы. ИИ будет жестко резать примитивную лесть и дежурные фразы.',
    badge: 'Искренность',
    thunks: {
      start: 'fetchStartAntiFlatteryTrainer',
      send: 'fetchSendAntiFlatteryResponse',
      finish: 'fetchFinishAntiFlatteryTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Калибровка искренности)',
      // 🔥 Роль берем динамически из сценария (Брат, Подруга, Партнер)
      aiRoleName: 'Близкий человек',
      thinkingText: '⏳ Близкий человек реагирует на похвалу...',
      finishText:
        '🗣️ Разговор окончен. Система вычисляет индекс искренности ваших слов.',
      finishButtonText: 'Получить оценку искренности',
      finishButtonLoadingText: 'Анализ текста психологом-ИИ...',
    },
    criteria: [
      { key: 'sincerity', label: 'Искренность' },
      { key: 'focus', label: 'Фокус на усилиях' },
    ],
  },

  // КУРС: ИСКУССТВО ОТВЕТОВ НА ВОПРОСЫ (qa_master)
  // ==========================================
  taxi_blitz: {
    id: 'taxi_blitz',
    title: '🚖 Такси-Блиц',
    description:
      'Симуляция спонтанного диалога. Разговорчивый водитель-философ засыпает вас неожиданными вопросами о смысле жизни. Удержите темп беседы.',
    badge: 'Бытовой экспромт',
    thunks: {
      start: 'fetchStartTaxiBlitzTrainer',
      send: 'fetchSendTaxiBlitzResponse',
      finish: 'fetchFinishTaxiBlitzTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Скорость ответов)',
      // 🔥 Роль динамическая: подтягивается из выбранного сценария (например, Водитель-меломан, Пассажир-оптимист)
      aiRoleName: 'Собеседник',
      thinkingText: '⏳ Собеседник обдумывает следующую мысль...',
      finishText:
        '🗣️ Поездка подошла к концу. Собеседник оценивает, насколько интересным и быстрым в общении вы оказались.',
      finishButtonText: 'Послушать финальный вердикт',
      finishButtonLoadingText: 'Анализ речевой скорости...',
    },
    criteria: [
      { key: 'reactionSpeed', label: 'Скорость мышления' },
      { key: 'structuralFrame', label: 'Структура ответа' },
    ],
  },
  family_minefield: {
    id: 'family_minefield',
    title: '🍽️ Семейный ужин: Минное поле',
    description:
      'Праздничное застолье прерывается бестактным вопросом «с подвохом» от прямолинейного родственника. Сохраните лицо и переведите тему.',
    badge: 'Стресс-диалог',
    thunks: {
      start: 'fetchStartFamilyMinefieldTrainer',
      send: 'fetchSendFamilyMinefieldResponse',
      finish: 'fetchFinishFamilyMinefieldTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Отражение бестактности)',
      // 🔥 Роль динамическая из сценария (Тетя, Дядя, Бабушка, Троюродный брат)
      aiRoleName: 'Родственник',
      thinkingText: '⏳ Родственник прищуривается и подливает чай...',
      finishText:
        '🗣️ Застолье завершено. Система оценивает ваш уровень хладнокровия и дипломатичности.',
      finishButtonText: 'Узнать вердикт семейного совета',
      finishButtonLoadingText:
        'Анализ уровня защиты и токсичности...',
    },
    criteria: [
      { key: 'emotionalControl', label: 'Хладнокровие' },
      { key: 'topicShift', label: 'Элегантный перефраз' },
    ],
  },

  // ==========================================
  // КУРС: МАСТЕР ВОПРОСОВ (question_architect)
  // ==========================================
  vintage_scout: {
    id: 'vintage_scout',
    title: '🕵️‍♂️ Винтажный раритет',
    description:
      'Сложные переговоры с закрытым или хитрым персонажем. С помощью открытых вопросов докопайтесь до скрытых дефектов и реальной истории вещи.',
    badge: 'Глубинная разведка',
    thunks: {
      start: 'fetchStartVintageScoutTrainer',
      send: 'fetchSendVintageScoutResponse',
      finish: 'fetchFinishVintageScoutTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Глубинные вопросы)',
      // 🔥 Роль динамическая из сценария (Коллекционер винила, Продавец Волги, Скрытная хозяйка)
      aiRoleName: 'Продавец',
      thinkingText: '⏳ Собеседник недоверчиво разглядывает вас...',
      finishText:
        '🗣️ Вы завершили расспросы. Владелец анализирует, удалось ли вам втереться в доверие и узнать всю правду.',
      finishButtonText: 'Узнать реальное состояние раритета',
      finishButtonLoadingText: 'Вычисление индекса открытости ИИ...',
    },
    criteria: [
      { key: 'openQuestions', label: 'Воронка вопросов' },
      { key: 'trustBuilding', label: 'Доверие' },
    ],
  },
  deaf_passenger: {
    id: 'deaf_passenger',
    title: '🚂 Попутчик-Глухарь',
    description:
      'Собеседник бесконечно флудит и уходит от темы. Поймайте микро-паузу и снайперским вопросом вежливо верните контроль над таймингом.',
    badge: 'Перехват инициативы',
    thunks: {
      start: 'fetchStartDeafPassengerTrainer',
      send: 'fetchSendDeafPassengerResponse',
      finish: 'fetchFinishDeafPassengerTrainer',
    },
    ui: {
      sessionLabel: 'Текущая сессия ИИ (Управление фокусом)',
      // 🔥 Роль динамическая из сценария (Рыбак в поезде, Парикмахер, Тренер, Любитель заговоров)
      aiRoleName: 'Рассказчик',
      thinkingText:
        '⏳ Собеседник продолжает увлеченно тараторить...',
      finishText:
        '🗣️ Диалог остановлен. Нейросеть вычисляет, насколько технично вы перехватили управление инициативой.',
      finishButtonText: 'Получить оценку перехвата руля',
      finishButtonLoadingText: 'Анализ структуры перебивания...',
    },
    criteria: [
      { key: 'interruptionTiming', label: 'Точность перехвата' },
      { key: 'focusReturn', label: 'Возврат к сути' },
    ],
  },
}

// Преобразуем объект в массив для интро-экрана, чтобы не дублировать константы
export const WORKOUT_MODES_LIST = Object.values(WORKOUT_CONFIGS)
