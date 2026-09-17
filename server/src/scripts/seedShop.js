import mongoose from 'mongoose'
import ShopItem from '../models/ShopItem.js'
import dotenv from 'dotenv'

import items from '../constants/shopItems.js'

dotenv.config()


const seedShop = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    await ShopItem.deleteMany({})
    await ShopItem.insertMany(items)
    console.log('✅ Витрина магазина успешно заполнена товарами!')
    process.exit()
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

seedShop()
