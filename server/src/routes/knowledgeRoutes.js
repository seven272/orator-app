import express from 'express'
import {
  getKnowledgeList,
  getKnowledgeBySlug,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
} from '../controllers/knowledgeController.js'
import {
  checkAuth,
  optionalAuth,
  checkAdmin,
} from '../middlewares/authMiddleware.js'

const router = express.Router()

// Публичные / гостевые маршруты (optionalAuth)
router.get('/', optionalAuth, getKnowledgeList)
router.get('/:slug', optionalAuth, getKnowledgeBySlug)

// Админские маршруты (checkAuth + checkAdmin)
router.post('/', checkAuth, checkAdmin, createKnowledgeItem)
router.put('/:id', checkAuth, checkAdmin, updateKnowledgeItem)
router.delete('/:id', checkAuth, checkAdmin, deleteKnowledgeItem)

export default router
