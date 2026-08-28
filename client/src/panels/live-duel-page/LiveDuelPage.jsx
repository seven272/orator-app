import styles from './LiveDuelPage.module.css'
import LiveDuelContainer from './live-duel-container/LiveDuelContainer'

const LiveDuelPage = () => {
  return (
    <div className={styles.live_duel}>
      <LiveDuelContainer />
    </div>
  )
}

export default LiveDuelPage
