import Route from '../models/Route.js';

export const getAllRoutes = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const routes = await Route.find(filter).sort({ routeNumber: 1 });

    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching routes',
      error: error.message
    });
  }
};

export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findById(req.params.id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    }

    res.json({
      success: true,
      data: route
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching route',
      error: error.message
    });
  }
};

export const getRoutesByType = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['metro', 'bus', 'rapidTransit'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid route type'
      });
    }

    const routes = await Route.find({ type, isActive: true })
      .sort({ routeNumber: 1 });

    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching routes by type',
      error: error.message
    });
  }
};

export const getNearbyRoutes = async (req, res) => {
  try {
    const { lat, lng, radius = 3000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseInt(radius);

    // Convert radius (meters) to approximate degrees
    const latDelta = radiusNum / 111320;
    const lngDelta = radiusNum / (111320 * Math.cos(latNum * Math.PI / 180));

    // Find routes that have at least one stop within the bounding box
    const routes = await Route.find({
      isActive: true,
      stops: {
        $elemMatch: {
          'coordinates.lat': { $gte: latNum - latDelta, $lte: latNum + latDelta },
          'coordinates.lng': { $gte: lngNum - lngDelta, $lte: lngNum + lngDelta }
        }
      }
    });

    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching nearby routes',
      error: error.message
    });
  }
};

export const searchRoutes = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const routes = await Route.find({
      $or: [
        { routeNumber: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { origin: { $regex: q, $options: 'i' } },
        { destination: { $regex: q, $options: 'i' } },
        { 'stops.name': { $regex: q, $options: 'i' } }
      ],
      isActive: true
    }).limit(20);

    res.json({
      success: true,
      count: routes.length,
      data: routes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching routes',
      error: error.message
    });
  }
};