
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const porjectController = require('../controllers/porjectController');

// --- API Endpoints ---
// --- User Authentication ---
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// --- Project Management ---
router.post('/create-project/:userId', porjectController.createProject);
router.get('/projects/:userId', porjectController.getUserProjects);
router.get('/project/:projectId', porjectController.getProjectById);
router.put('/update-project/:projectId', porjectController.updateProject);
router.delete('/project/:projectId', porjectController.deleteProjectById);
router.get('/project/:projectId/sensors', porjectController.getProjectSensors);

// --- Sensor Management ---
router.post('/add-sensor/:projectId', porjectController.addSensorToProject);
router.put('/update-sensor/:sensorId', porjectController.updateSensorInfo);
router.get('/sensor/:sensorId', porjectController.getSensorById);
router.delete('/sensor/:sensorId', porjectController.deleteSensorById);
router.put('/update-graph-info/:sensorId', porjectController.updateGraphInfo);

// --- Combined Sensor Graph ---
router.post('/project/:projectId/combine-sensors', porjectController.createCombinedSensorGraph);
router.post('/combined-graph/:graphId/average', porjectController.getCombinedGraphAverage);
router.get('/combined-graph/:graphId/data', porjectController.getCombinedGraphData);
router.put('/combined-graph/:graphId', porjectController.updateCombinedGraph); 
router.delete('/combined-graph/:graphId', porjectController.deleteCombinedGraph);


// --- Data Retrieval ---
router.get('/data/:token', porjectController.getProjectData);

// --- Signal & Button Management ---
router.post('/create-sendingsignal/:projectId', porjectController.createSendingSignal);
router.put('/update-signal/:signalId', porjectController.updateSignalTitle);
router.delete('/delete-signal/:signalId', porjectController.deleteSignal);

// New Button Routes
router.post('/signal/:signalId/add-button', porjectController.addButton);
router.put('/button/:buttonId', porjectController.updateButton);
router.delete('/button/:buttonId', porjectController.deleteButton);
router.put('/button/:buttonId/releaseddata', porjectController.updateButtonReleasedData);


module.exports = router;