import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['metro', 'bus', 'rapidTransit'],
    required: true
  },
  line: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#000000'
  },
  origin: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  stops: [{
    name: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    sequence: {
      type: Number,
      required: true
    }
  }],
  geometry: {
    type: {
      type: String,
      enum: ['LineString'],
      default: 'LineString'
    },
    coordinates: [[Number]]
  },
  operatingHours: {
    start: {
      type: String,
      required: true,
      default: '06:00'
    },
    end: {
      type: String,
      required: true,
      default: '23:00'
    }
  },
  frequency: {
    type: Number,
    default: 10
  },
  fare: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

routeSchema.index({ type: 1, isActive: 1 });

export default mongoose.model('Route', routeSchema);