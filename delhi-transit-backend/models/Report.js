// models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: {
      values: ['delay', 'crowding', 'facility_issue', 'safety', 'cleanliness', 'other'],
      message: '{VALUE} is not a valid report type'
    },
    required: [true, 'Report type is required']
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Station',
    index: true
  },
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    index: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    trim: true
  },
  severity: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'critical'],
      message: '{VALUE} is not a valid severity level'
    },
    required: [true, 'Severity is required'],
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Reporter information is required'],
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['active', 'in_progress', 'resolved', 'closed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'active',
    index: true
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String,
    maxlength: [500, 'Admin notes cannot exceed 500 characters']
  },
  upvotes: {
    type: Number,
    default: 0,
    min: [0, 'Upvotes cannot be negative']
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  images: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ createdAt: -1 });
reportSchema.index({ status: 1, severity: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ location: '2dsphere' });

// Validation: At least one of stationId or routeId must be provided
reportSchema.pre('validate', function(next) {
  if (!this.stationId && !this.routeId) {
    this.invalidate('stationId', 'Either stationId or routeId must be provided');
  }
  next();
});

// Virtuals
reportSchema.virtual('age').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
});

reportSchema.virtual('isResolved').get(function() {
  return this.status === 'resolved' || this.status === 'closed';
});

// Instance methods
reportSchema.methods.resolve = async function(adminId, notes) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = adminId;
  if (notes) this.adminNotes = notes;
  return await this.save();
};

reportSchema.methods.upvote = async function() {
  this.upvotes += 1;
  return await this.save();
};

// Static methods
reportSchema.statics.getActiveReportsByStation = async function(stationId) {
  return await this.find({
    stationId,
    status: 'active',
    isPublic: true
  })
    .sort('-upvotes -createdAt')
    .populate('reportedBy', 'name')
    .limit(10);
};

reportSchema.statics.getActiveReportsByRoute = async function(routeId) {
  return await this.find({
    routeId,
    status: 'active',
    isPublic: true
  })
    .sort('-upvotes -createdAt')
    .populate('reportedBy', 'name')
    .limit(10);
};

reportSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          type: '$type',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.status',
        types: {
          $push: {
            type: '$_id.type',
            severity: '$_id.severity',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);

  return stats;
};

reportSchema.statics.getTrendingReports = async function(limit = 10) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  return await this.find({
    status: 'active',
    isPublic: true,
    createdAt: { $gte: oneDayAgo }
  })
    .sort('-upvotes -createdAt')
    .populate('stationId', 'name type')
    .populate('routeId', 'routeNumber name')
    .populate('reportedBy', 'name')
    .limit(limit);
};

// Middleware
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'resolved' || this.status === 'closed')) {
    if (!this.resolvedAt) {
      this.resolvedAt = new Date();
    }
  }
  next();
});

// Set toJSON options to include virtuals
reportSchema.set('toJSON', { virtuals: true });
reportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', reportSchema);