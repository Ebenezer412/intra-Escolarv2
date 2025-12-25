import express from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// Rotas públicas
router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Rotas protegidas
router.get('/verify', AuthController.verifyToken);
router.post('/logout', authenticate, AuthController.logout);
router.get('/perfil', authenticate, AuthController.getProfile);
router.put('/perfil', authenticate, AuthController.updateProfile);
router.put('/alterar-senha', authenticate, AuthController.changePassword);

export default router;