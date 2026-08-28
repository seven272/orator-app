import React from 'react'
import { Spinner } from '@vkontakte/vkui'
// import { Flex } from '@vkontakte/vkui'
import styles from './Loader.module.css'
const Loader = () => {
  return (
    <div className={styles.loader_section}>
      {/* <Flex
        aria-busy={true}
        aria-live="polite"
        direction="column"
        gap={32}
        margin="auto"
      > */}
        <Spinner size="large">данные загружаются</Spinner>
      {/* </Flex> */}
    </div>
  )
}

export default Loader
