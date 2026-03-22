import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';

const router = express.Router();

const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');

// Allowed frontend origins for OAuth redirects (prevents open-redirect attacks)
const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://delhi-route-optimizer.vercel.app',
    process.env.CLIENT_URL?.replace(/\/$/, ''),
].filter(Boolean);

// Validate and extract the frontend origin from the OAuth state parameter
function extractFrontendOrigin(stateParam) {
    try {
        if (stateParam) {
            const decoded = JSON.parse(Buffer.from(stateParam, 'base64').toString());
            if (decoded.origin) {
                const cleanOrigin = decoded.origin.replace(/\/$/, '');
                if (ALLOWED_ORIGINS.includes(cleanOrigin)) {
                    return cleanOrigin;
                }
                console.warn('OAuth state origin not in allowlist:', cleanOrigin);
            }
        }
    } catch (e) {
        console.warn('Could not parse OAuth state:', e.message);
    }
    return CLIENT_URL;
}

// Helper: generate JWT and send it to the frontend via postMessage
function handleOAuthCallback(req, res, frontendOrigin) {
    const targetOrigin = frontendOrigin || CLIENT_URL;
    console.log("✅ OAuth callback successful for user:", req.user?.email, "→ redirecting to:", targetOrigin);

    if (!req.user) {
        return res.send(getCallbackHTML(null, 'Authentication failed', null, targetOrigin));
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            userId: req.user._id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    const user = {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
    };

    // Send HTML page that will post message to parent
    res.send(getCallbackHTML(token, null, user, targetOrigin));
}

// HTML page sent to the popup
function getCallbackHTML(token, error, user, targetOrigin) {
    const clientUrl = targetOrigin || CLIENT_URL;
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
                const clientUrl = '${clientUrl}';

                console.log("Checking for opener...");
                if (!window.opener) {
                    console.log("No opener found - redirecting to app with token fallback");
                    const targetUrl = clientUrl;
                    
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
                        // Send success message to parent window using CLIENT_URL as target origin
                        window.opener.postMessage({
                            type: 'OAUTH_SUCCESS',
                            token: token,
                            user: user
                        }, clientUrl);
                        
                        console.log("✅ Sent OAUTH_SUCCESS to parent");
                    } else {
                        // Send error message
                        window.opener.postMessage({
                            type: 'OAUTH_ERROR',
                            error: error || 'Authentication failed'
                        }, clientUrl);
                        
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
    // Capture the frontend origin so we can redirect back to it after OAuth
    const frontendOrigin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || '';
    const state = Buffer.from(JSON.stringify({ origin: frontendOrigin })).toString('base64');
    console.log("   Frontend origin:", frontendOrigin);
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
        state
    })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
    console.log("🟢 Google callback received");
    // Extract the frontend origin from the state parameter
    const frontendOrigin = extractFrontendOrigin(req.query.state);
    console.log("   Resolved frontend origin:", frontendOrigin);
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/api/oauth/failure'
    }, (err, user, info) => {
        if (err) {
            console.error("Google auth error:", err);
            return res.send(getCallbackHTML(null, err.message, null, frontendOrigin));
        }
        if (!user) {
            console.error("No user returned from Google");
            return res.send(getCallbackHTML(null, 'Authentication failed', null, frontendOrigin));
        }
        req.user = user;
        handleOAuthCallback(req, res, frontendOrigin);
    })(req, res, next);
});

// GitHub OAuth
router.get('/github', (req, res, next) => {
    console.log("⚫ GitHub OAuth route hit");
    const frontendOrigin = req.headers.origin || req.headers.referer?.replace(/\/+$/, '') || '';
    const state = Buffer.from(JSON.stringify({ origin: frontendOrigin })).toString('base64');
    passport.authenticate('github', {
        scope: ['user:email'],
        session: false,
        state
    })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
    console.log("⚪ GitHub callback received");
    const frontendOrigin = extractFrontendOrigin(req.query.state);
    passport.authenticate('github', {
        session: false,
        failureRedirect: '/api/oauth/failure'
    }, (err, user, info) => {
        if (err) {
            console.error("GitHub auth error:", err);
            return res.send(getCallbackHTML(null, err.message, null, frontendOrigin));
        }
        if (!user) {
            console.error("No user returned from GitHub");
            return res.send(getCallbackHTML(null, 'Authentication failed', null, frontendOrigin));
        }
        req.user = user;
        handleOAuthCallback(req, res, frontendOrigin);
    })(req, res, next);
});



// Failure route
router.get('/failure', (req, res) => {
    res.send(getCallbackHTML(null, 'Authentication failed. Please try again.'));
});

export default router;