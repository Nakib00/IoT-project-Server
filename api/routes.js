
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const porjectController = require('../controllers/porjectController');

// --- API Endpoints ---
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/create-project', porjectController.createProject);
router.get('/data/:token', porjectController.getProjectData);
router.post('/update-sensor-info', porjectController.updateSensorInfo);

module.exports = router;