const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Store pending logins with both token and verifier
const pendingLogins = new Map();

app.get('/oauth/callback', async (req, res) => {
    const { code, state, verifier } = req.query;
    
    if (!code) {
        return res.status(400).send('Missing authorization code');
    }
    
    if (!verifier) {
        return res.status(400).send('Missing code verifier');
    }
    
    try {
        // Exchange code for token using the verifier from the query
        const tokenResponse = await axios.post('https://apis.roblox.com/oauth/v1/token',
            new URLSearchParams({
                client_id: '3733353280957003172',
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: 'https://roblox-oauth-proxy1.onrender.com/oauth/callback',
                code_verifier: verifier
            }).toString(),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        
        // Generate a one-time token for your Electron app to claim this login
        const claimToken = crypto.randomBytes(16).toString('hex');
        pendingLogins.set(claimToken, tokenResponse.data);
        
        // Auto-expire after 5 minutes
        setTimeout(() => pendingLogins.delete(claimToken), 300000);
        
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Successful</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #e8e8e8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .container { text-align: center; background: #1a1a1a; padding: 40px; border-radius: 8px; border: 1px solid #333; }
                    h1 { color: #00A2FF; margin-bottom: 20px; }
                    .success { color: #4CAF50; font-size: 48px; margin-bottom: 20px; }
                    .close-text { margin-top: 30px; font-size: 12px; color: #777; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success">✓</div>
                    <h1>Login Successful!</h1>
                    <p>You can now close this window and return to the app.</p>
                    <p class="close-text">This window will close automatically in 3 seconds...</p>
                </div>
                <script>
                    fetch('http://localhost:54593/oauth/claim?token=${claimToken}').catch(() => console.log('Could not reach local app'));
                    setTimeout(() => window.close(), 3000);
                </script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Token exchange failed:', error.response?.data || error.message);
        res.status(500).send('Login failed: ' + (error.response?.data?.error_description || error.message));
    }
});

// Endpoint for Electron app to claim the login result
app.get('/claim/:token', (req, res) => {
    const token = req.params.token;
    const data = pendingLogins.get(token);
    if (data) {
        pendingLogins.delete(token);
        res.json(data);
    } else {
        res.status(404).json({ error: 'Not found or expired' });
    }
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Roblox OAuth Proxy</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #e8e8e8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { text-align: center; background: #1a1a1a; padding: 40px; border-radius: 8px; border: 1px solid #333; }
                h1 { color: #00A2FF; }
                .status { color: #4CAF50; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Roblox OAuth Proxy</h1>
                <p>This service is running correctly.</p>
                <p class="status">✓ Ready to handle OAuth callbacks</p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`OAuth proxy running on port ${PORT}`);
});
