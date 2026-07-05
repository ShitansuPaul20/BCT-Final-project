const { Router } = require('express');
const { validateRegister } = require('../validators/auth.validator');
const authController = require('../controller/auth.controller');
const { authMiddleware } = require('../middlewire/auth.middlewire');
const { validateLogin } = require('../validators/auth.validator');
const { verifyEmail } = require('../controller/auth.controller');

const authRouter = Router();

authRouter.post('/register',validateRegister, authController.register);
authRouter.get('/verify-email', authController.verifyEmail);
authRouter.post('/login', validateLogin, authController.login);
authRouter.get('/get-me', authMiddleware, authController.getme);
// authRouter.post('/logout', logout);

module.exports = authRouter;