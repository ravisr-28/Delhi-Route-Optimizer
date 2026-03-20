import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import crypto from 'crypto';
import User from '../models/User.js';

// ─── Google OAuth ────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/oauth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser(profile, 'google');
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }));
}

// ─── GitHub OAuth ────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/oauth/github/callback`,
        scope: ['user:email'],
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await findOrCreateOAuthUser(profile, 'github');
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    }));
}


// ─── Helper: Find or create user from OAuth profile ──────
async function findOrCreateOAuthUser(profile, provider) {
    const email = profile.emails?.[0]?.value || `${profile.id}@${provider}.oauth`;
    const name = profile.displayName || profile.username || email.split('@')[0];

    // Check if user already exists with this email
    let user = await User.findOne({ email });

    if (!user) {
        // Create new user with a random password (they'll use OAuth to log in)
        const randomPass = crypto.randomBytes(32).toString('hex');
        user = await User.create({
            name,
            email,
            password: randomPass,
            role: 'user',
            isActive: true,
            oauthProvider: provider,
            oauthId: profile.id,
        });
    }

    return user;
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

export default passport;