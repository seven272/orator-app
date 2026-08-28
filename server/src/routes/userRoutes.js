import { Router } from 'express'
import {
  login,
  register,
  logout,
  getMe,
  getUserProfile,
  updateProfile,
  vkAuth,
  linkEmailToVkAccount,
  linkVkToEmailAccount,
  mergeAccounts
} from '../controllers/userController.js'
import upload from '../middlewares/upload.js'
import { checkAuth } from '../middlewares/authMiddleware.js'
//middleware авторизации VK
import vkLaunchParamsAuth from "../middlewares/vkLaunchParamsAuth.js"; 

const router = new Router()



// localhost:5020/api/user/register

router.post(
  '/upload-avatar',
  checkAuth,
  upload.single('avatar'),
  (req, res) => {
    try {
      res.status(201).json({
        message: 'Изображение аватара успешно загружено',
        url: `static/avatars/${req.file.filename}`,
      })
    } catch (error) {
      console.log(
        'Ошибка сервера при загрузке аватара',
        error
      )
    }
  }
)

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', checkAuth, getMe)
router.get('/get-data-profile', checkAuth, getUserProfile)
router.put('/update-profile', checkAuth, updateProfile)
router.post('/vk-auth', vkLaunchParamsAuth, vkAuth)
router.post('/link-email', checkAuth, linkEmailToVkAccount)
router.post('/link-vk', checkAuth, vkLaunchParamsAuth, linkVkToEmailAccount);
router.post('/merge-accounts', checkAuth, mergeAccounts);

export default router
