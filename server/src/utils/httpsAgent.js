import { Agent } from 'https'; // Импортируем класс Agent из встроенного модуля https

// Создаем экземпляр агента с нужной нам опцией
const agent = new Agent({
  rejectUnauthorized: false, // Вот эта опция отключает проверку
});

export default agent;