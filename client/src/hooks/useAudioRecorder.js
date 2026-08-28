import { useState, useRef, useCallback , useMemo} from 'react'

const useAudioRecorder = () => {
  // Ссылка на готовый аудиофайл для плеера
  const [audioUrl, setAudioUrl] = useState(null)
  // Флаг процесса записи (идет сейчас или нет)
  const [isRecording, setIsRecording] = useState(false)

  // Объект MediaRecorder, который управляет потоком
  const mediaRecorder = useRef(null)
  // Массив для хранения «кусочков» (chunks) аудиоданных
  const audioChunks = useRef([])

   // Определяем поддержку API браузером один раз при инициализации
  const isSupported = useMemo(() => {
    return !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  }, []);

  // Функция старта записи
  const startRecording = useCallback(async () => {
    try {
      // ШАГ 1: Запрашиваем доступ к микрофону у браузера
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      // ШАГ 2: Создаем экземпляр рекордера и обнуляем буфер данных
      mediaRecorder.current = new MediaRecorder(stream)
      audioChunks.current = []

      // ШАГ 3: Подписываемся на получение данных (срабатывает порциями в процессе записи)
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data)
      }

      // ШАГ 4: Логика по завершению записи
      mediaRecorder.current.onstop = () => {
        // Собираем все кусочки в один объект Blob (формат ogg/opus)
        const blob = new Blob(audioChunks.current, {
          type: 'audio/ogg; codecs=opus',
        })
        // Создаем временную URL-ссылку на этот объект для тега <audio>
        setAudioUrl(URL.createObjectURL(blob))
      }

      // ШАГ 5: Запускаем физический процесс записи
      mediaRecorder.current.start()
      setIsRecording(true)
    } catch (err) {
      // Обработка ошибки (если пользователь запретил микрофон)
      console.error('Ошибка доступа к микрофону:', err)
      throw err
    }
  }, [])

  // Функция остановки записи
  const stopRecording = useCallback(() => {
    // Проверяем, что рекордер активен перед остановкой
    if (mediaRecorder.current?.state === 'recording') {
      // ШАГ 6: Останавливаем запись (сработает событие onstop, описанное выше)
      mediaRecorder.current.stop()
      setIsRecording(false)

      // ШАГ 7: Отключаем микрофон полностью (гасим индикатор записи в браузере)
      mediaRecorder.current.stream
        .getTracks()
        .forEach((track) => track.stop())
    }
  }, [])

  // Функция для сброса состояния (например, для новой попытки)
 const resetAudio = useCallback(() => {
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl); // Удаляем ссылку из памяти браузера
  }
  setAudioUrl(null);
  audioChunks.current = [];
}, [audioUrl]); 

  // Возвращаем интерфейс для использования в компонентах
  return {
    isSupported,
    audioUrl,
    isRecording,
    startRecording,
    stopRecording,
    resetAudio,
  }
}
export { useAudioRecorder }
