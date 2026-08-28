import { useState, useEffect, useRef, useCallback } from 'react'

const useSpeech = (lang = 'ru-RU') => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false) // Возвращаем состояние
  const recognitionRef = useRef(null)
  const isManuallyStopped = useRef(true)

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('Speech Recognition API не поддерживается')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      // Авто-перезапуск, если прослушивание не было прервано намеренно
      if (!isManuallyStopped.current) {
        try {
          recognition.start()
        } catch (err) {
          console.log(err)
        }
      }
    }

    recognition.onresult = (event) => {
      let text = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        // ВАЖНО: [0] после [i] — это доступ к самому первому (лучшему) варианту распознавания
        text += event.results[i][0].transcript
      }
      setTranscript(text)
    }

    recognitionRef.current = recognition

    return () => {
      isManuallyStopped.current = true
      recognition.stop()
    }
  }, [lang])

  const startListening = useCallback(() => {
    setTranscript('')
    isManuallyStopped.current = false
    try {
      recognitionRef.current?.start()
    } catch (e) {
      console.warn(
        'Попытка запуска уже активного или неинициализированного API',
      )
    }
  }, [])

  const stopListening = useCallback(() => {
    isManuallyStopped.current = true
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    transcript, // Текущий распознанный текст
    isListening, // Булево: работает ли микрофон сейчас
    startListening, // Функция запуска
    stopListening, // Функция остановки
    resetTranscript, // Функция очистки текста
  }
}

export { useSpeech }
