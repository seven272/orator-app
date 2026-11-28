export const DEFAULT_PAYMENT_RULES = {
  web: 'yookassa',
  vk_web: 'yookassa',
  vk_native_mobile: 'vk_votes',
  telegram: 'info_only',
  rustore: 'info_only',
}

const RESTRICTION_MESSAGES = {
  vk_native_mobile:
    'Оформление Premium статуса недоступно.',
  telegram:
    'Оформление подписки временно недоступно внутри Telegram Mini App. Вы можете активировать доступ в веб-версии Govorix — после этого статус автоматически синхронизируется с вашим аккаунтом.',
  rustore:
    'Оформление подписки временно недоступно в этой сборке приложения. Вы можете активировать доступ в веб-версии Govorix — после этого статус автоматически обновится в профиле.',
  default:
    'Оформление подписки временно недоступно на данном устройстве. Попробуйте открыть веб-версию сервиса на компьютере.',
}

/**
 * Преобразует правила из БД и текущий platformKey в удобные флаги для модалок и кнопок
 */
export const resolvePaymentPolicy = (platformKey = 'web', rulesFromStore = null) => {
  const rules = {
    ...DEFAULT_PAYMENT_RULES,
    ...(rulesFromStore || {}),
  }

  const activeRule = rules[platformKey] || 'yookassa'

  const canUseYookassa = activeRule === 'yookassa' || activeRule === 'both'
  const canUseVkVotes = activeRule === 'vk_votes' || activeRule === 'both'
  const isPaymentRestricted =
    activeRule === 'info_only' || (!canUseYookassa && !canUseVkVotes)

  return {
    platformKey,
    activeRule,
    canUseYookassa,
    canUseVkVotes,
    isPaymentRestricted,
    restrictionMessage:
      RESTRICTION_MESSAGES[platformKey] || RESTRICTION_MESSAGES.default,
  }
}
