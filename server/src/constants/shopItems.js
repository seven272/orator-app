const items = [
  {
    code: 'streak_freeze',
    title: 'Заморозка стрика',
    description:
      'Спасает твою серию тренировок от сброса, если ты пропустил день.',
    price: 1000,
    category: 'utility',
    icon: 'freeze',
  },

  {
    code: 'thought_guru',
    title: 'Гуру Мысли',
    description:
      'Уникальное звание, которое будет отображаться у тебя в лидерборде.',
    price: 5500,
    category: 'achievement',
    icon: 'crown-title',
  },

  // 
  {
    code: 'title_neon',
    title: 'Голос Ночного Города',
    description:
      'Эксклюзивное звание, которое навсегда зафиксируется в твоем профиле и лидерборде.',
    price: 6500,
    category: 'achievement',
    icon: 'title-neon',
  },

  // 🎟️ ПОШТУЧНЫЕ БИЛЕТЫ ДЛЯ КОНКРЕТНЫХ ИИ-ТРЕНАЖЕРОВ
  {
    code: 'ticket_ai-poem-rap',
    title: 'Купон «Рэп-манифест»',
    description:
      '1 разовая попытка прохождения ИИ-тренажера «Рэп-манифест». Преврати классическую поэзию в хип-хоп трек с жестким ритмом.',
    price: 10000,
    category: 'utility',
    icon: 'ticket-rap',
  },
  {
    code: 'ticket_ai-bargain',
    title: 'Купон: «Торг уместен»',
    description:
      '1 разовая попытка прохождения ИИ-тренажера «Торг уместен». Попробуй сбить цену у неуступчивого и жесткого продавца.',
    price: 10000,
    category: 'utility',
    icon: 'ticket-bargain',
  },
  {
    code: 'ticket_ai-historical-battle',
    title: 'Купон «Эхо Истории»',
    description:
      '1 разовая попытка прохождения ИИ-тренажера «Эхо Истории». Примени проверенные приемы великих ораторов в бытовых ситуациях.',
    price: 10000,
    category: 'utility',
    icon: 'ticket-history',
  },

  // 👑 ВРЕМЕННЫЙ PREMIUM (На 1 час)
  {
    code: 'premium_1h',
    title: 'Premium статус (1 час)',
    description:
      'Мгновенный безлимитный доступ ко всем ИИ-тренажерам и курсам на 60 минут без рекламы.',
    price: 50000,
    category: 'utility',
    icon: 'premium-1h',
  },

  // --- МЯГКО СКРЫВАЕМЫЕ: Физический мерч (Остаются в коде базы данных) ---
  {
    code: 'merch_orator_badge',
    title: 'Значок «Орден Златоуста»',
    description:
      'Физический металлический значок с логотипом платформы. Доставка почтой.',
    price: 500,
    category: 'merch',
    icon: 'physical-badge',
  },
  {
    code: 'merch_diploma_frame',
    title: 'Диплом «Мастер Речи»',
    description:
      'Именной печатный сертификат в деревянной рамке. Отправка СДЭК/Почтой.',
    price: 800,
    category: 'merch',
    icon: 'physical-diploma',
  },

  // --- МЯГКО СКРЫВАЕМЫЕ: Товары категории темы /theme ---
  {
    code: 'theme_cyberpunk',
    title: 'Пак тем: Киберпанк',
    description:
      'Открывает доступ к острым вопросам от ИИ-корпораций будущего.',
    price: 100000,
    category: 'theme',
    icon: 'theme-cyber',
  },
]
export default items
