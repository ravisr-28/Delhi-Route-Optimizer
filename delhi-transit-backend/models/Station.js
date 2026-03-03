// models/Station.js
const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Station name is required'],
    trim: true,
    index: true
  },
  type: {
    type: String,
    enum: {
      values: ['metro', 'bus_stop'],
      message: '{VALUE} is not a valid station type'
    },
    required: [true, 'Station type is required']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function(coords) {
          return coords.length === 2 &&
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates. Format: [longitude, latitude]'
      }
    }
  },
  lines: {
    type: [String],
    default: []
  },
  facilities: {
    type: [String],
    enum: ['escalator', 'lift', 'parking', 'atm', 'restroom', 'water', 'shelter', 'seating', 'wifi'],
    default: []
  },
  address: {
    type: String,
    trim: true
  },
  nearbyLandmarks: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  avgWaitTime: {
    type: Number,
    min: 0,
    default: 0 // in minutes
  }
}, {
  timestamps: true
});

// Create 2dsphere index for geospatial queries
stationSchema.index({ location: '2dsphere' });

// Compound indexes for common queries
stationSchema.index({ type: 1, isActive: 1 });
stationSchema.index({ name: 'text' });

// Virtual for readable coordinates
stationSchema.virtual('coordinates').get(function() {
  return {
    latitude: this.location.coordinates[1],
    longitude: this.location.coordinates[0]
  };
});

// Instance method to find nearby stations
stationSchema.methods.findNearby = async function(maxDistance = 1000) {
  return await this.constructor.find({
    _id: { $ne: this._id },
    location: {
      $near: {
        $geometry: this.location,
        $maxDistance: maxDistance
      }
    }
  }).limit(10);
};

// Static method to find stations near coordinates
stationSchema.statics.findNearCoordinates = async function(coords, maxDistance = 1000, limit = 10) {
  return await this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coords // [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    }
  }).limit(limit);
};

// Static method to find stations within a bounding box
stationSchema.statics.findInBounds = async function(southwest, northeast) {
  return await this.find({
    location: {
      $geoWithin: {
        $box: [southwest, northeast]
      }
    }
  });
};

module.exports = mongoose.model('Station', stationSchema);