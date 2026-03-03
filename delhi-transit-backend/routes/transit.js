// routes/transit.js
const express = require('express');
const router = express.Router();
const RouteFinder = require('../services/routeFinder');
const Report = require('../models/Report');
const Station = require('../models/Station');
const Route = require('../models/Route');
const { authenticateUser, authenticateAdmin, optionalAuth } = require('../middleware/auth');

// ============================================
// ROUTE SEARCH ENDPOINTS
// ============================================

/**
 * POST /api/transit/routes/search
 * Find optimal routes between source and destination
 */
router.post('/routes/search', async (req, res) => {
  try {
    const { source, destination, preferences } = req.body;

    // Validate input
    if (!source || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination coordinates are required'
      });
    }

    if (!Array.isArray(source) || !Array.isArray(destination)) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates must be arrays [longitude, latitude]'
      });
    }

    const routeFinder = new RouteFinder();
    const routes = await routeFinder.findRoutes(source, destination, preferences);

    res.json({
      success: true,
      data: routes,
      message: 'Routes found successfully'
    });
  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error finding routes'
    });
  }
});

/**
 * GET /api/transit/routes/nearby
 * Find nearby routes based on current location
 */
router.get('/routes/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);

    const nearbyStations = await Station.findNearCoordinates(
      [longitude, latitude],
      parseInt(radius)
    );

    res.json({
      success: true,
      data: nearbyStations,
      count: nearbyStations.length
    });
  } catch (error) {
    console.error('Error finding nearby routes:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding nearby routes'
    });
  }
});

// ============================================
// STATION ENDPOINTS
// ============================================

/**
 * GET /api/transit/stations
 * Get all stations with optional filters
 */
router.get('/stations', async (req, res) => {
  try {
    const { type, line, search } = req.query;
    const filter = { isActive: true };

    if (type) filter.type = type;
    if (line) filter.lines = line;
    if (search) {
      filter.$text = { $search: search };
    }

    const stations = await Station.find(filter)
      .sort({ name: 1 })
      .limit(100);

    res.json({
      success: true,
      data: stations,
      count: stations.length
    });
  } catch (error) {
    console.error('Error fetching stations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stations'
    });
  }
});

/**
 * GET /api/transit/stations/:id
 * Get station details by ID
 */
router.get('/stations/:id', async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }

    // Find nearby stations
    const nearby = await station.findNearby(1000);

    res.json({
      success: true,
      data: {
        station,
        nearby
      }
    });
  } catch (error) {
    console.error('Error fetching station:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching station details'
    });
  }
});

// ============================================
// REPORT ENDPOINTS
// ============================================

/**
 * POST /api/transit/reports
 * Create a new report (requires authentication)
 */
router.post('/reports', authenticateUser, async (req, res) => {
  try {
    const { type, stationId, routeId, description, severity } = req.body;

    // Validate required fields
    if (!type || !description || !severity) {
      return res.status(400).json({
        success: false,
        message: 'Type, description, and severity are required'
      });
    }

    // Validate that at least stationId or routeId is provided
    if (!stationId && !routeId) {
      return res.status(400).json({
        success: false,
        message: 'Either stationId or routeId must be provided'
      });
    }

    const report = await Report.create({
      type,
      stationId,
      routeId,
      description,
      severity,
      reportedBy: req.user._id,
      status: 'active'
    });

    const populatedReport = await Report.findById(report._id)
      .populate('stationId', 'name type')
      .populate('routeId', 'routeNumber name')
      .populate('reportedBy', 'name email');

    res.status(201).json({
      success: true,
      data: populatedReport,
      message: 'Report created successfully'
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating report'
    });
  }
});

/**
 * GET /api/transit/reports
 * Get all reports (admin) or filtered reports (public)
 */
router.get('/reports', optionalAuth, async (req, res) => {
  try {
    const { status, type, stationId, routeId, severity, limit = 50 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (stationId) filter.stationId = stationId;
    if (routeId) filter.routeId = routeId;
    if (severity) filter.severity = severity;

    // Non-admin users can only see active reports
    if (!req.user || req.user.role !== 'admin') {
      filter.status = 'active';
    }

    const reports = await Report.find(filter)
      .populate('stationId', 'name type location')
      .populate('routeId', 'routeNumber name')
      .populate('reportedBy', 'name')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reports'
    });
  }
});

/**
 * GET /api/transit/reports/:id
 * Get report details by ID
 */
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('stationId')
      .populate('routeId')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching report'
    });
  }
});

/**
 * PATCH /api/transit/reports/:id
 * Update report status (admin only)
 */
router.patch('/reports/:id', authenticateAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const updateData = { status };
    if (adminNotes) updateData.adminNotes = adminNotes;

    if (status === 'resolved' || status === 'closed') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = req.user._id;
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('stationId')
      .populate('routeId')
      .populate('reportedBy', 'name email')
      .populate('resolvedBy', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating report'
    });
  }
});

/**
 * POST /api/transit/reports/:id/upvote
 * Upvote a report (requires authentication)
 */
router.post('/reports/:id/upvote', authenticateUser, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: { upvotes: report.upvotes },
      message: 'Report upvoted successfully'
    });
  } catch (error) {
    console.error('Error upvoting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error upvoting report'
    });
  }
});

/**
 * DELETE /api/transit/reports/:id
 * Delete a report (admin only)
 */
router.delete('/reports/:id', authenticateAdmin, async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting report'
    });
  }
});

// ============================================
// STATISTICS ENDPOINTS (Admin)
// ============================================

/**
 * GET /api/transit/stats
 * Get system statistics
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const [
      totalStations,
      totalRoutes,
      activeReports,
      reportsByType,
      reportsBySeverity
    ] = await Promise.all([
      Station.countDocuments({ isActive: true }),
      Route.countDocuments({ isActive: true }),
      Report.countDocuments({ status: 'active' }),
      Report.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Report.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$severity', count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalStations,
        totalRoutes,
        activeReports,
        reportsByType,
        reportsBySeverity
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    });
  }
});

module.exports = router;