const { Router } = require('express');
const userController = require('../controllers/userController');

const router = Router();
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

module.exports = router;
