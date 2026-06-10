const express = require('express');
const axios = require('axios');
const app = express();

const LOCAL_REDIRECT = 'http://localhost:54593/oauth/callback';

app.get('/oauth/callback', async (req, res) => {
    const { code, state } = req.query;
    
    if (!code) {
        return res.status(400).send('Missing authorization code');
    }
    
    try {
        await axios.get(LOCAL_REDIRECT, {
            params: { code, state },
            timeout: 5000
        });
        
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
                    <p>You can now close this window and return to your app.</p>
                    <p class="close-text">This window will close automatically in 3 seconds...</p>
                </div>
                <script>setTimeout(() => window.close(), 3000);</script>
            </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Login Error</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #e8e8e8; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .container { text-align: center; background: #1a1a1a; padding: 40px; border-radius: 8px; border: 1px solid #333; }
                    h1 { color: #CC3333; margin-bottom: 20px; }
                    .error { color: #CC3333; font-size: 48px; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="error">✗</div>
                    <h1>Login Error</h1>
                    <p>Could not connect to your local application.</p>
                    <p>Make sure Roblox Account Manager is running.</p>
                </div>
                <script>setTimeout(() => window.close(), 5000);</script>
            </body>
            </html>
        `);
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
