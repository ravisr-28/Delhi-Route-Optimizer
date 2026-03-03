const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Helper: generate JWT and send it to the frontend via a popup callback page
function handleOAuthCallback(req, res) {
    if (!req.user) {
        return res.send(getCallbackHTML(null, 'Authentication failed'));
    }

    const token = jwt.sign(
        { userId: req.user._id, email: req.user.email, role: req.user.role, name: req.user.name },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );

    const user = {
        username: req.user.email,
        name: req.user.name,
        role: req.user.role,
    };

    res.send(getCallbackHTML(token, null, user));
}

// HTML page sent to the popup — it posts the token to the parent window and closes
function getCallbackHTML(token, error, user) {
    return `<!DOCTYPE html>
<html>
<head><title>Login</title></head>
<body style="background:#0b0f19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;">
    <p>${error ? '❌ ' + error : '✅ Login successful! Closing...'}</p>
  </div>
  <script>
    ${token ? `
      window.opener && window.opener.postMessage({
        type: 'OAUTH_SUCCESS',
        token: '${token}',
        user: ${JSON.stringify(user)}
      }, '${CLIENT_URL}');
      setTimeout(() => window.close(), 1000);
    ` : `
      window.opener && window.opener.postMessage({
        type: 'OAUTH_ERROR',
        error: '${error || 'Unknown error'}'
      }, '${CLIENT_URL}');
      setTimeout(() => window.close(), 2000);
    `}
  </script>
</body>
</html>`;
}

// ─── Google ──────────────────────────────────────────────
router.get('/google', (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
        return res.send(getCallbackHTML(null, 'Google OAuth not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env'));
    }
    passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/api/oauth/failure', session: false }),
    handleOAuthCallback
);

// ─── GitHub ──────────────────────────────────────────────
router.get('/github', (req, res, next) => {
    if (!process.env.GITHUB_CLIENT_ID) {
        return res.send(getCallbackHTML(null, 'GitHub OAuth not configured. Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to .env'));
    }
    passport.authenticate('github', { scope: ['user:email'], session: false })(req, res, next);
});

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/api/oauth/failure', session: false }),
    handleOAuthCallback
);

// ─── Microsoft ───────────────────────────────────────────
router.get('/microsoft', (req, res, next) => {
    if (!process.env.MICROSOFT_CLIENT_ID) {
        return res.send(getCallbackHTML(null, 'Microsoft OAuth not configured. Add MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to .env'));
    }
    passport.authenticate('microsoft', { scope: ['user.read'], session: false })(req, res, next);
});

router.get('/microsoft/callback',
    passport.authenticate('microsoft', { failureRedirect: '/api/oauth/failure', session: false }),
    handleOAuthCallback
);

// ─── Failure ─────────────────────────────────────────────
router.get('/failure', (req, res) => {
    res.send(getCallbackHTML(null, 'OAuth authentication failed. Please try again.'));
});

module.exports = router;
