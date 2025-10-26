const { Router } = require('express');
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/porjectController');

const router = Router();

router.post('/:projectId', auth, projectController.addSensorToProject);
router.put('/:sensorId', auth, projectController.updateSensorInfo);
router.get('/by-id/:sensorId', auth, projectController.getSensorById);
router.delete('/:sensorId', auth, projectController.deleteSensorById);
router.put('/:sensorId/graph', auth, projectController.updateGraphInfo);

module.exports = router;
