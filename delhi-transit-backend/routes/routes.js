import express from 'express';
import {
  getAllRoutes,
  getRouteById,
  getRoutesByType,
  getNearbyRoutes,
  searchRoutes
} from '../controllers/routeController.js';

const router = express.Router();

router.get('/', getAllRoutes);
router.get('/search', searchRoutes);
router.get('/nearby', getNearbyRoutes);
router.get('/type/:type', getRoutesByType);
router.get('/:id', getRouteById);

export default router;