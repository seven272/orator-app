import { useState, useRef, useCallback } from 'react'
import { bufferToWav } from '../utils/wavWriter.js'

const useSpeechSber = () => {
  const [isListening, setIsListening] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)

  const audioContextRef = useRef(null)
  const processorRef = useRef(null)
  const streamRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingLengthRef = useRef(0)

  // Реф для безопасного хранения и вызова колбэка отправки
  const onStopCallbackRef = useRef(null)

  const startListening = useCallback(async () => {
    setAudioBlob(null)
    audioChunksRef.current = []
    recordingLengthRef.current = 0
    onStopCallbackRef.current = null // Сбрасываем колбэк при старте

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      streamRef.current = stream

      audioContextRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )({
        sampleRate: 16000,
      })

      const source =
        audioContextRef.current.createMediaStreamSource(stream)

      processorRef.current =
        audioContextRef.current.createScriptProcessor(2048, 1, 1)

      processorRef.current.onaudioprocess = (e) => {
        const leftChannel = e.inputBuffer.getChannelData(0)
        audioChunksRef.current.push(new Float32Array(leftChannel))
        recordingLengthRef.current += 2048
      }

      source.connect(processorRef.current)
      processorRef.current.connect(
        audioContextRef.current.destination,
      )

      setIsListening(true)
    } catch (err) {
      console.error('Ошибка доступа к микрофону в WAV-режиме:', err)
      setIsListening(false)
    }
  }, [])

  const stopListening = useCallback((callback) => {
    if (callback) {
      onStopCallbackRef.current = callback
    }

    if (processorRef.current) {
      processorRef.current.disconnect()
      processorRef.current.onaudioprocess = null
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (recordingLengthRef.current === 0) {
      setIsListening(false)
      return
    }

    // Склеиваем все куски Float32Array в один монолитный массив сэмплов
    const flatBuffer = new Float32Array(recordingLengthRef.current)
    let offset = 0
    for (let i = 0; i < audioChunksRef.current.length; i++) {
      flatBuffer.set(audioChunksRef.current[i], offset)
      offset += audioChunksRef.current[i].length
    }

    // Конвертируем сырые данные в полноценный WAV файл
    const wavBlob = bufferToWav(flatBuffer, 16000)
    setAudioBlob(wavBlob)
    setIsListening(false)

    // Если в функцию передан колбэк — вызываем его, передавая готовый бинарник
    if (onStopCallbackRef.current) {
      onStopCallbackRef.current(wavBlob)
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setAudioBlob(null)
    audioChunksRef.current = []
    recordingLengthRef.current = 0
    onStopCallbackRef.current = null
  }, [])

  return {
    transcript: '',
    audioBlob,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
  }
}

export { useSpeechSber }
