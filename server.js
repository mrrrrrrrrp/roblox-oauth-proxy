const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const app = express();

// Store pending sessions (in memory)
const sessions = new Map();

// The main OAuth callback endpoint
app.get('/oauth/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).send('Missing authorization code');
    }
    
    // Get the session data using the state as key
    const session = sessions.get(state);
    if (!session) {
        return res.status(400).send('Invalid or expired session');
    }
    
    const { verifier, eventId } = session;
    
    try {
        // Exchange code for token
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
        
        // Store the result
        sessions.set(state, { ...session, result: tokenResponse.data, completed: true });
        
        // Send success page that will close itself
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
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success">✓</div>
                    <h1>Login Successful!</h1>
                    <p>You can close this window and return to the app.</p>
                </div>
                <script>setTimeout(() => window.close(), 3000);</script>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Token exchange failed:', error.response?.data || error.message);
        res.status(500).send('Login failed');
    }
});

// Endpoint for Electron app to get the result
app.get('/api/result/:state', (req, res) => {
    const state = req.params.state;
    const session = sessions.get(state);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.completed && session.result) {
        // Clean up after returning result
        sessions.delete(state);
        return res.json(session.result);
    }
    
    res.status(202).json({ status: 'pending' });
});

// Endpoint for Electron app to create a session
app.post('/api/session', express.json(), (req, res) => {
    const { state, verifier } = req.body;
    sessions.set(state, { verifier, completed: false });
    res.json({ status: 'ok' });
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
                <p class="status">✓ Ready</p>
            </div>
        </body>
        </html>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`OAuth proxy running on port ${PORT}`);
});
