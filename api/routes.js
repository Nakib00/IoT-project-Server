
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const porjectController = require('../controllers/porjectController');

// --- API Endpoints ---
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

router.post('/create-project/:userId', porjectController.createProject);
router.get('/projects/:userId', porjectController.getUserProjects);
router.get('/project/:projectId', porjectController.getProjectById);
router.put('/update-project/:projectId', porjectController.updateProject);
router.delete('/project/:projectId', porjectController.deleteProjectById);

router.post('/add-sensor/:projectId', porjectController.addSensorToProject);
router.put('/update-sensor/:sensorId', porjectController.updateSensorInfo);
router.delete('/sensor/:sensorId', porjectController.deleteSensorById);

router.put('/update-graph-info/:sensorId', porjectController.updateGraphInfo);

router.get('/data/:token', porjectController.getProjectData);


module.exports = router;