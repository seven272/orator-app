import mongoose from 'mongoose'

const PaymentPolicySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_config',
      unique: true,
    },
    // Правила оплаты цифровых товаров (Premium, Курсы) по платформам:
    // 'yookassa' — только ЮKassa
    // 'vk_votes' — только Голоса ВК
    // 'both' — выбор (ЮKassa или Голоса ВК)
    // 'info_only' — скрыть оплату и показать информационную заглушку (Reader-режим)
    paymentRules: {
      web: {
        type: String,
        enum: ['yookassa', 'info_only'],
        default: 'yookassa',
      },
      vk_web: {
        type: String,
        enum: ['yookassa', 'vk_votes', 'both', 'info_only'],
        default: 'yookassa',
      },
      vk_native_mobile: {
        type: String,
        enum: ['vk_votes', 'info_only', 'yookassa', 'both'],
        default: 'vk_votes',
      },
      telegram: {
        type: String,
        enum: ['info_only', 'yookassa'],
        default: 'info_only',
      },
      rustore: {
        type: String,
        enum: ['info_only', 'yookassa'],
        default: 'info_only',
      },
    },
  },
  { timestamps: true }
)

const PaymentPolicy = mongoose.model('PaymentPolicy', PaymentPolicySchema)
export default PaymentPolicy
