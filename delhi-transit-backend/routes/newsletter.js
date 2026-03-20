import express from 'express';
import Subscriber from '../models/Subscriber.js';
import { sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// @route   POST /api/newsletter/subscribe
// @desc    Subscribe to newsletter
// @access  Public
router.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Check if already subscribed
        let subscriber = await Subscriber.findOne({ email });

        if (subscriber) {
            if (subscriber.status === 'active') {
                return res.status(400).json({ message: 'Email is already subscribed' });
            } else {
                // Reactivate
                subscriber.status = 'active';
                await subscriber.save();
            }
        } else {
            // Create new subscriber
            subscriber = new Subscriber({ email });
            await subscriber.save();
        }

        // Send welcome email (don't block response)
        sendWelcomeEmail(email).catch(err => console.error('Delayed email error:', err));

        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to the newsletter!'
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Email is already subscribed' });
        }
        console.error('Newsletter error:', error);
        res.status(500).json({ message: 'Server error, please try again later' });
    }
});

export default router;