import { Router } from 'express';
import { login, logout, getAuthStatus, resetPassword } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/status', getAuthStatus);
router.post('/reset-password', resetPassword);

export default router;
