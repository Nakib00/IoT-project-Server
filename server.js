// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const USERS_DB_PATH = path.join(__dirname, 'users.json');

// --- Helper Functions ---

// Function to read the users database
const readUsersDB = () => {
    if (!fs.existsSync(USERS_DB_PATH)) {
        fs.writeFileSync(USERS_DB_PATH, JSON.stringify([]));
    }
    const data = fs.readFileSync(USERS_DB_PATH);
    return JSON.parse(data);
};

// Function to write to the users database
const writeUsersDB = (users) => {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
};

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// --- API Endpoints for User Management ---

// Register a new user
app.post('/register', (req, res) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    const users = readUsersDB();
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Create the new user object with an empty data array
    const newUser = {
        id: uuidv4(),
        name,
        email,
        phone,
        password, // In a real app, you MUST hash the password!
        token: uuidv4(),
        data: [] // Initialize with an empty array for sensor data
    };

    users.push(newUser);
    writeUsersDB(users);

    console.log(`User registered: ${name} (${email})`);
    res.status(201).json({ message: 'User registered successfully!' });
});

// Login a user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = readUsersDB();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        console.log(`User logged in: ${user.name}`);
        res.json({ 
            message: 'Login successful!', 
            token: user.token,
            name: user.name
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password.' });
    }
});

// Get user data for the dashboard
app.get('/data/:token', (req, res) => {
    const { token } = req.params;
    const users = readUsersDB();
    const user = users.find(u => u.token === token);

    if (user) {
        // Return the data array for the specific user
        res.json(user.data || []);
    } else {
        res.status(404).json({ message: 'Invalid token.' });
    }
});

// Regenerate a user's token
app.post('/regenerate-token', (req, res) => {
    const { currentToken } = req.body;
    const users = readUsersDB();
    const userIndex = users.findIndex(u => u.token === currentToken);

    if (userIndex !== -1) {
        const newToken = uuidv4();
        users[userIndex].token = newToken;
        writeUsersDB(users); // Just update the token in the main DB

        console.log(`Token regenerated for user: ${users[userIndex].name}`);
        res.json({ message: 'Token regenerated successfully!', newToken: newToken });
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});


// --- WebSocket Server for ESP32 Communication ---
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received from ESP32:', data);

            if (data.token) {
                const users = readUsersDB();
                if (users.some(u => u.token === data.token)) {
                    ws.isAuthenticated = true;
                    ws.token = data.token;
                    ws.send(JSON.stringify({ status: 'authenticated' }));
                    console.log(`Device authenticated with token: ${ws.token.substring(0,8)}...`);
                } else {
                    ws.send(JSON.stringify({ status: 'authentication failed' }));
                    ws.terminate();
                }
            } else if (ws.isAuthenticated && data.temperature !== undefined) {
                // --- THIS IS THE NEW DATA SAVING LOGIC ---
                // NOTE: Reading and writing the entire file on every message is inefficient
                // for a large-scale application. A database is recommended for production.
                const users = readUsersDB();
                const userIndex = users.findIndex(u => u.token === ws.token);

                if (userIndex !== -1) {
                    const newDataPoint = {
                        datetime: new Date().toISOString(),
                        data: data.temperature // Save the temperature under the 'data' key
                    };
                    
                    // Add the new data point to the user's data array
                    users[userIndex].data.push(newDataPoint);

                    // Optional: Keep the data array from growing too large
                    if (users[userIndex].data.length > 100) {
                        users[userIndex].data.shift(); // Remove the oldest entry
                    }
                    
                    // Write the entire updated database back to the file
                    writeUsersDB(users);
                    console.log(`Saved data for user: ${users[userIndex].name}`);
                }
            }
        } catch (error) {
            console.error('Failed to process message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// --- Start the Server ---
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
