
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// --- API Endpoints ---
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/create-project', userController.createProject);
router.get('/user-projects/:email', userController.getUserProjects);
router.get('/data/:token', userController.getProjectData);
router.post('/update-sensor-info', userController.updateSensorInfo);

module.exports = router;