import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import UserProfile from './user-profile/UserProfile'
import { checkIsAuth } from '../../redux/slices/authSlice'

const ProfilePage = () => {
  const navigate = useNavigate()
  const isAuth = useSelector(checkIsAuth)
  const { isLoading } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!isLoading && !isAuth) {
      navigate('/auth', { replace: true })
    }
  }, [isAuth, isLoading, navigate])
  return (
    <div>
      <UserProfile />
    </div>
  )
}

export default ProfilePage
