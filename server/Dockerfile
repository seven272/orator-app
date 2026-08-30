FROM node:22-alpine

WORKDIR /app

# Открываем твой внутренний порт SERVER_DOCKER_PORT из .env
EXPOSE 5020

# Копируем файлы зависимостей
COPY package.json package-lock.json ./

# Чистая и быстрая установка только продакшен-библиотек
RUN npm ci --only=production

# Копируем весь остальной код бэкенда из Git
COPY . ./

# Запускаем Node.js напрямую
CMD [ "node", "src/server.js" ]
