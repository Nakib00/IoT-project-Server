const { Router } = require('express');
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/porjectController');

const router = Router();

router.post('/:userId/create', auth, projectController.createProject);
router.get('/:userId', auth, projectController.getUserProjects);
router.get('/by-id/:projectId', auth, projectController.getProjectById);
router.put('/:projectId', auth, projectController.updateProject);
router.delete('/:projectId', auth, projectController.deleteProjectById);
router.get('/:projectId/sensors', auth, projectController.getProjectSensors);

module.exports = router;
