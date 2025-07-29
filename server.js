const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const apiRoutes = require('./api/routes');
const UserModel = require('./models/userModel');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
    server
});

// Make the WebSocket Server (wss) accessible to other modules (like controllers)
app.set('wss', wss);

const PORT = 3000;

// --- Middleware ---
// Use the built-in Express middleware for parsing JSON bodies
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use('/', apiRoutes);

// --- WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
        try {
            const incomingData = JSON.parse(message);
            console.log('Received from ESP32:', incomingData);

            // 1. Handle Authentication
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
            }
            // 2. Handle Combined Sensor and Button Data
            else if (ws.isAuthenticated && incomingData.action === 'device_update') {
                const payload = incomingData.payload;

                // If the payload contains sensor data, save it
                if (payload.sensors) {
                    const success = UserModel.addDataToSensor(ws.token, payload.sensors);
                    if (success) {
                        console.log(`Saved sensor data for project: ${ws.token.substring(0, 8)}...`);
                    }
                }

                // If the payload contains button data, log it (or process it)
                if (payload.buttons) {
                    console.log(`Received button state for project: ${ws.token.substring(0, 8)}...`, payload.buttons);
                    // You could add logic here to forward this button data to a web dashboard, for example.
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