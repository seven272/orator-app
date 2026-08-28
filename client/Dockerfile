# --- ЭТАП 1: Сборка React-приложения внутри Node.js ---
FROM node:22-alpine AS react-build

WORKDIR /app

# Сначала копируем только файлы зависимостей для кэширования слоев Docker
COPY package.json package-lock.json ./

# Используем ci для чистой установки строго по лок-файлу
RUN npm ci

# Копируем весь остальной код фронтенда из репозитория
COPY . .

# Выделяем Node.js 1.5 ГБ RAM под сборку, чтобы процесс не упал
ENV NODE_OPTIONS="--max-old-space-size=3072"

# Запускаем компиляцию статики React
RUN npm run build


# --- ЭТАП 2: Чистый продакшен-контейнер Nginx ---
FROM nginx:stable-alpine

# Удаляем стандартный дефолтный конфиг
RUN rm /etc/nginx/conf.d/default.conf

# Копируем скомпилированную статику React из первого этапа (react-build)
COPY --from=react-build /app/dist /usr/share/nginx/html

# Копируем твой nginx.conf из первого этапа в папку конфигураций Nginx
COPY --from=react-build /app/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем твой порт CLIENT_NGINX_PORT=4020
EXPOSE 4020

CMD [ "nginx", "-g", "daemon off;" ]
