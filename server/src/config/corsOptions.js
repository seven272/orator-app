//кратко
// const corsOptions = {
//   origin: ['http://localhost:5173', 'http://localhost:3000'],
//   optionsSuccessStatus: 200,
//   credentials: true,
// }

//развернуто
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3020',
      'https://185.251.89.77',
      'http://185.251.89.77',
      'https://vk.com',
      'https://vk.ru',
      /vk\.com$/,
      /vk\.me$/,
    ]

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('CORS policy violation'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  optionsSuccessStatus: 200, //предоставляет статус-код для успешного разрешения запросов
  credentials: true, // Разрешает передачу cookies
}
export default corsOptions
