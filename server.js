
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const apiRoutes = require('./api/routes');
const UserModel = require('./models/userModel'); 

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
    server
});

const PORT = 3000;

// --- Middleware ---
// Use the built-in Express middleware for parsing JSON bodies
app.use(express.json()); 
app.use(express.static('public'));

// --- API Routes ---
app.use('/', apiRoutes);

// --- WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
        try {
            const incomingData = JSON.parse(message);
            console.log('Received from ESP32:', incomingData);

            if (incomingData.token && incomingData.action === 'auth') {
                if (UserModel.findProjectByToken(incomingData.token)) {
                    ws.isAuthenticated = true;
                    ws.token = incomingData.token;
                    ws.send(JSON.stringify({
                        status: 'authenticated'
                    }));
                    console.log(`Device authenticated: ${ws.token.substring(0, 8)}...`);
                } else {
                    ws.send(JSON.stringify({
                        status: 'authentication failed'
                    }));
                    ws.terminate();
                }
            } else if (ws.isAuthenticated && incomingData.action === 'data') {
                const success = UserModel.addDataToSensor(ws.token, incomingData.payload);
                if (success) {
                    console.log(`Saved data for project token: ${ws.token.substring(0, 8)}...`);
                }
            }
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});


// --- Start Server ---
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});