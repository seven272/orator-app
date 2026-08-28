import React from 'react'

import styles from './RadioText.module.css'
const RadioText = () => {
  return (
    <div>
      <form className={styles.boxed}>
        <input
          type="radio"
          id="android"
          name="skills"
          value="Android Development"
        />
        <label htmlFor="android">Android Development</label>

        <input
          type="radio"
          id="ios"
          name="skills"
          value="iOS Development"
        />
        <label htmlFor="ios">iOS Development </label>

        <br></br>
        <input type="submit" value="SUBMIT" />
      </form>
    </div>
  )
}

export default RadioText
