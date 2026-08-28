import styles from './ShopPage.module.css'
import Shop from './shop/Shop'

const ShopPage = () => {
  return (
    <div className={styles.shop_page}>
      <Shop />
    </div>
  )
}

export default ShopPage
