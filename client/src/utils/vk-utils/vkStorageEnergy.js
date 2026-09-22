// utils/vkStorageEnergy.js
import bridge from '@vkontakte/vk-bridge'

/**
 * 1. Получение текущего баланса энергии гостя из облачного хранилища ВК
 * @returns {Promise<number>} Количество доступной энергии (по умолчанию 3)
 */
const getGuestEnergy = async () => {
  try {
    // Асинхронно запрашиваем массив ключей из облака ВК [INDEX]
    const response = await bridge.send('VKWebAppStorageGet', {
      keys: ['govorix_guest_energy'],
    })

    // Извлекаем значение первого найденного ключа
    const energyData = response.keys?.[0]?.value

    // 🐣 КЕЙС: Гость зашел в Govorix впервые (ключ пустой или отсутствует)
    if (!energyData || energyData.trim() === '') {
      // Инициализируем стартовый бак на 3 единицы в облаке ВК
      await bridge.send('VKWebAppStorageSet', {
        key: 'govorix_guest_energy',
        value: '3',
      })
      return 3
    }

    // Возвращаем числовое значение
    return parseInt(energyData, 10)
  } catch (error) {
    console.error(
      'Ошибка чтения VK Storage, сэйф-откат на 3 ед.:',
      error,
    )
    // В случае сбоя API ВКонтакте даем безопасный дефолт, чтобы не блокировать игру
    return 3
  }
}

/**
 * 2. Запись обновленного баланса энергии гостя в облачное хранилище ВК
 * @param {number} newValue - Новое количество энергии
 * @returns {Promise<boolean>} Статус успешности операции
 */
const setGuestEnergy = async (newValue) => {
  try {
    // VK Storage принимает строго строки, принудительно приводим тип
    const response = await bridge.send('VKWebAppStorageSet', {
      key: 'govorix_guest_energy',
      value: String(newValue),
    })

    return !!response.result
  } catch (error) {
    console.error('Ошибка записи баланса в VK Storage:', error)
    return false
  }
}

export { setGuestEnergy, getGuestEnergy }
