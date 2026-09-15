// Генерация случайной строки (code_verifier)
export const generateCodeVerifier = () => {
  const array = new Uint32Array(56)
  window.crypto.getRandomValues(array)
  return Array.from(array, (dec) =>
    ('0' + dec.toString(16)).substr(-2),
  ).join('')
}

// Хэширование строки в SHA-256 (code_challenge) для передачи в ВК
export const generateCodeChallenge = async (verifier) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await window.crypto.subtle.digest('SHA-256', data)

  // Переводим в URL-safe Base64 формат, как требует спецификация OAuth 2.1
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}
