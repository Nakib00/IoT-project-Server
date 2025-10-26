const { Router } = require('express');
const { auth } = require('../middleware/auth');
const projectController = require('../controllers/porjectController');

const router = Router();

router.post('/create/:projectId', auth, projectController.createSendingSignal);
router.put('/:signalId/title', auth, projectController.updateSignalTitle);
router.delete('/:signalId', auth, projectController.deleteSignal);

router.post('/:signalId/buttons', auth, projectController.addButton);
router.put('/buttons/:buttonId', auth, projectController.updateButton);
router.delete('/buttons/:buttonId', auth, projectController.deleteButton);
router.put('/buttons/:buttonId/releaseddata', auth, projectController.updateButtonReleasedData);

module.exports = router;
