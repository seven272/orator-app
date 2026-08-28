import { useDispatch } from 'react-redux'

import { fetchLogoutUser } from '../../../../redux/slices/authSlice'
import styles from './Logout.module.css'
const Logout = ({ setShowForm }) => {
  const dispatch = useDispatch()

  const handleLogout = () => {
    dispatch(fetchLogoutUser())
    setShowForm(false)
  } 
  return (
    <div className={styles.section}>
      <span className={styles.title}>
        Вы уверены, что хотите покинуть сайт?
      </span>
      <button className={styles.btn} onClick={handleLogout}>
        Выйти
      </button>
    </div>
  )
}

export default Logout
