const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const FALLBACK_CLIENT_URL = 'https://route-optimizer-frontend.vercel.app'; // Update with actual production URL if known

// Helper: generate JWT and send it to the frontend via postMessage
function handleOAuthCallback(req, res) {
    console.log("✅ OAuth callback successful for user:", req.user?.email);

    if (!req.user) {
        return res.send(getCallbackHTML(null, 'Authentication failed'));
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
    );

    const user = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
    };

    // Send HTML page that will post message to parent
    res.send(getCallbackHTML(token, null, user));
}

// HTML page sent to the popup
function getCallbackHTML(token, error, user) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Authentication</title>
    <style>
        body {
            background: #0b0f19;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .container {
            padding: 2rem;
            border-radius: 1rem;
            background: rgba(255,255,255,0.05);
            max-width: 400px;
        }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .spinner {
            width: 40px;
            height: 40px;
            margin: 20px auto;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        ${error ?
            `<div class="error">❌ ${error}</div>` :
            `<div class="success">✅ Login Successful!</div>`
        }
        <div class="spinner"></div>
        <p style="color: #9ca3af;">Redirecting you back to the app...</p>
    </div>

    <script>
        (function() {
            console.log("OAuth callback page loaded");
            
            const sendMessageToParent = () => {
                const token = '${token}';
                const user = ${JSON.stringify(user)};
                const error = '${error || ''}';
                const clientUrl = '${CLIENT_URL}';

                console.log("Checking for opener...");
                if (!window.opener) {
                    console.log("No opener found - redirecting to app with token fallback");
                    // Try to use CLIENT_URL, then FALLBACK, then origin as last resort
                    const targetUrl = clientUrl || FALLBACK_CLIENT_URL || window.location.origin;
                    
                    if (token) {
                        window.location.href = targetUrl + '/?token=' + encodeURIComponent(token) + '&isPopup=true';
                    } else {
                        window.location.href = targetUrl + '/?error=' + encodeURIComponent(error || 'auth_failed') + '&isPopup=true';
                    }
                    return;
                }

                try {
                    console.log("Opener found. Sending message...");
                    if (token) {
                        // Send success message to parent window
                        // Use wildcard '*' temporarily if standard origin fails, or just use CLIENT_URL
                        window.opener.postMessage({
                            type: 'OAUTH_SUCCESS',
                            token: token,
                            user: user
                        }, '*'); // Using '*' to ensure delivery during local dev port mismatches
                        
                        console.log("✅ Sent OAUTH_SUCCESS to parent");
                    } else {
                        // Send error message
                        window.opener.postMessage({
                            type: 'OAUTH_ERROR',
                            error: error || 'Authentication failed'
                        }, '*');
                        
                        console.log("❌ Sent OAUTH_ERROR to parent");
                    }
                    
                    // Wait a moment then close the popup
                    setTimeout(() => {
                        console.log("Closing popup...");
                        window.close();
                    }, 1000);
                } catch (e) {
                    console.error("Error sending message to opener:", e);
                    // Fallback to redirect if message fails
                    if (token) {
                        window.location.href = clientUrl + '/?token=' + encodeURIComponent(token) + '&isPopup=true';
                    }
                }
            };

            // Send message after a tiny delay to ensure parent is ready
            setTimeout(sendMessageToParent, 500);
        })();
    </script>
</body>
</html>`;
}

// Google OAuth
router.get('/google', (req, res, next) => {
    console.log("🔵 Google OAuth route hit");
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    console.log("🟢 Google callback received");
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/api/oauth/failure'
    }, (err, user, info) => {
        if (err) {
            console.error("Google auth error:", err);
            return res.send(getCallbackHTML(null, err.message));
        }
        if (!user) {
            console.error("No user returned from Google");
            return res.send(getCallbackHTML(null, 'Authentication failed'));
        }
        req.user = user;
        handleOAuthCallback(req, res);
    })(req, res, next);
});

// GitHub OAuth
router.get('/github', (req, res, next) => {
    console.log("⚫ GitHub OAuth route hit");
    passport.authenticate('github', {
        scope: ['user:email'],
        session: false
    })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
    console.log("⚪ GitHub callback received");
    passport.authenticate('github', {
        session: false,
        failureRedirect: '/api/oauth/failure'
    }, (err, user, info) => {
        if (err) {
            console.error("GitHub auth error:", err);
            return res.send(getCallbackHTML(null, err.message));
        }
        if (!user) {
            console.error("No user returned from GitHub");
            return res.send(getCallbackHTML(null, 'Authentication failed'));
        }
        req.user = user;
        handleOAuthCallback(req, res);
    })(req, res, next);
});



// Failure route
router.get('/failure', (req, res) => {
    res.send(getCallbackHTML(null, 'Authentication failed. Please try again.'));
});

module.exports = router;