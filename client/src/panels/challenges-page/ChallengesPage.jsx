import React from 'react'

import Challenges from './challenges/Challenges'
import styles from './ChallengesPage.module.css'

const ChallengesPage = () => {
  return (
    <div className={styles.challenges_page}>
      <Challenges />
    </div>
  )
}

export default ChallengesPage
