const { Router } = require('express');
const authRoutes = require('./auth.routes');
const projectRoutes = require('./project.routes');
const sensorRoutes = require('./sensor.routes');
const signalsRoutes = require('./signals.routes');
const combinedRoutes = require('./combined.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/sensors', sensorRoutes);
router.use('/signals', signalsRoutes);
router.use('/combined-graphs', combinedRoutes);

// Public token endpoint (no auth)
const projectController = require('../controllers/porjectController');
router.get('/data/:token', projectController.getProjectData);

module.exports = router;
