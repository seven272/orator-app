import mongoose from 'mongoose';
import ShopItem from '../models/ShopItem.js';
import dotenv from 'dotenv';

dotenv.config();

const items = [
  { code: 'streak_freeze', title: 'Заморозка стрика', description: 'Спасает твою серию тренировок от сброса, если ты пропустил день.', price: 50, category: 'utility', icon: 'freeze' },
  { code: 'theme_cyberpunk', title: 'Пак тем: Киберпанк', description: 'Открывает доступ к острым вопросам от ИИ-корпораций будущего.', price: 100, category: 'theme', icon: 'theme-cyber' },
  { code: 'thought_guru', title: 'Гуру Мысли', description: 'Уникальное звание, которое будет отображаться у тебя в лидерборде.', price: 150, category: 'achievement', icon: 'crown-title' },
   { 
      code: 'ai_hint_pack', 
      title: 'Двойной суфлер', 
      description: 'Добавляет +5 расширенных текстовых подсказок и тезисов от ИИ во время тренировки.', 
      price: 75, 
      category: 'utility', 
      icon: 'ai-prompt' 
    },
    { 
      code: 'custom_color_nickname', 
      title: 'Неоновый ник', 
      description: 'Выделяет и подсвечивает твое имя ярким цветом в глобальном лидерборде приложений.', 
      price: 200, 
      category: 'achievement', 
      icon: 'color-glow' 
    },

    // --- НОВЫЕ: Физический мерч ---
    { 
      code: 'merch_orator_badge', 
      title: 'Значок «Орден Златоуста»', 
      description: 'Физический металлический значок с логотипом платформы. Доставка почтой.', 
      price: 500, 
      category: 'merch', 
      icon: 'physical-badge' 
    },
    { 
      code: 'merch_diploma_frame', 
      title: 'Диплом «Мастер Речи»', 
      description: 'Именной печатный сертификат в деревянной рамке. Отправка СДЭК/Почтой.', 
      price: 800, 
      category: 'merch', 
      icon: 'physical-diploma' 
    }
];

const seedShop = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await ShopItem.deleteMany({});
    await ShopItem.insertMany(items);
    console.log('✅ Витрина магазина успешно заполнена товарами!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedShop();
