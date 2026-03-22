const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/register', validate(registerSchema), authController.registerUser);
router.post('/login', validate(loginSchema), authController.loginUser);
router.get('/me', authenticate, authController.getLoginUser);

module.exports = router;
