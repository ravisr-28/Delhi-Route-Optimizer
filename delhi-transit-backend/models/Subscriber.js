import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Please fill a valid email address']
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

export default mongoose.model('Subscriber', subscriberSchema);