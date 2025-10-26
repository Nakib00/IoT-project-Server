const { Router } = require('express');
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/porjectController');

const router = Router();

router.post('/:projectId', auth, projectController.createCombinedSensorGraph);
router.post('/:graphId/average', auth, projectController.getCombinedGraphAverage);
router.get('/:graphId/data', auth, projectController.getCombinedGraphData);
router.put('/:graphId', auth, projectController.updateCombinedGraph);
router.delete('/:graphId', auth, projectController.deleteCombinedGraph);
router.put('/:graphId/info', auth, projectController.updateCombinedGraphInfo);

module.exports = router;
