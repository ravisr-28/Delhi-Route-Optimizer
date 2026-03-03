const express = require('express');
const { 
  getAllRoutes, 
  getRouteById, 
  getRoutesByType,
  getNearbyRoutes,
  searchRoutes 
} = require('../controllers/routeController');

const router = express.Router();

router.get('/', getAllRoutes);
router.get('/search', searchRoutes);
router.get('/nearby', getNearbyRoutes);
router.get('/type/:type', getRoutesByType);
router.get('/:id', getRouteById);

module.exports = router;