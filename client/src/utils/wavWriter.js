/**
 * Конвертирует массив PCM-сэмплов в бинарный Blob полноценного WAV-файла (16кГц, 16бит, Моно)
 * @param {Float32Array} buffer - Сырые аудио-сэмплы
 * @param {number} sampleRate - Частота дискретизации (16000)
 * @returns {Blob} Готовый аудиофайл
 */
export function bufferToWav(buffer, sampleRate = 16000) {
  const bufferLength = buffer.length
  const wavBuffer = new ArrayBuffer(44 + bufferLength * 2)
  const view = new DataView(wavBuffer)

  // 1. RIFF дескриптор
  writeString(view, 0, 'RIFF')
  // Размер файла минус 8 байт для самого RIFF
  view.setUint32(4, 36 + bufferLength * 2, true)
  // WAVE тип
  writeString(view, 8, 'WAVE')
  
  // 2. fmt чанк (описание формата)
  writeString(view, 12, 'fmt ')
  // Размер чанка (16 байт)
  view.setUint32(16, 16, true)
  // Формат аудио: 1 = Несжатый PCM
  view.setUint16(20, 1, true)
  // Количество каналов: 1 = Моно
  view.setUint16(22, 1, true)
  // Частота дискретизации (16000 Гц)
  view.setUint32(24, sampleRate, true)
  // Количество байт в секунду (sampleRate * blockAlign)
  view.setUint32(28, sampleRate * 2, true)
  // Block Align (channels * bytes per sample) -> 1 * 2 = 2
  view.setUint16(32, 2, true)
  // Бит на сэмпл: 16 бит
  view.setUint16(34, 16, true)

  // 3. data чанк (само аудио)
  writeString(view, 36, 'data')
  // Размер аудиоданных в байтах
  view.setUint32(40, bufferLength * 2, true)

  // Записываем PCM данные, переводя Float32 (-1.0 ... 1.0) в Int16 (-32768 ... 32767)
  let offset = 44
  for (let i = 0; i < buffer.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, buffer[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
  }

  return new Blob([view.buffer], { type: 'audio/wav' })
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
}
