import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import UserProfile from './user-profile/UserProfile'
import { checkIsAuth } from '../../redux/slices/authSlice'
import { fetchProfileData } from '../../redux/slices/profileSlice'

const ProfilePage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isAuth = useSelector(checkIsAuth)
  const { isLoading } = useSelector((state) => state.auth)


  useEffect(() => {
dispatch(fetchProfileData())
  }, [dispatch])

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
