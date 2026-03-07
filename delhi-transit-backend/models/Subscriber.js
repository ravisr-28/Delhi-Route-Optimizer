const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    status: {
        type: String,
        enum: ['active', 'unsubscribed'],
        default: 'active'
    },
    subscriptionDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Subscriber', subscriberSchema);