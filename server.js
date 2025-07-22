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
const readUsersDB = () => {
    // This function is now more robust to prevent crashes from an empty/corrupt users.json
    try {
        if (!fs.existsSync(USERS_DB_PATH)) {
            // If file doesn't exist, create it with an empty array
            fs.writeFileSync(USERS_DB_PATH, JSON.stringify([]));
            return [];
        }

        const fileContent = fs.readFileSync(USERS_DB_PATH, 'utf8');
        
        // If the file exists but is empty, return an empty array
        if (fileContent.trim() === '') {
            return [];
        }

        // Otherwise, parse the content
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Fatal error reading or parsing users.json:", error);
        // If there's a parsing error (corrupt file), return an empty array to prevent a crash
        return [];
    }
};

const writeUsersDB = (users) => {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(users, null, 2));
};

// --- Middleware ---
app.use(bodyParser.json());
app.use(express.static('public'));

// --- API Endpoints ---

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
    const newUser = { id: uuidv4(), name, email, phone, password, projects: [] };
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
        res.json({ message: 'Login successful!', name: user.name, email: user.email });
    } else {
        res.status(401).json({ message: 'Invalid email or password.' });
    }
});

// Create a new project
app.post('/create-project', (req, res) => {
    const { email, projectName, description, developmentBoard, sensorCount } = req.body;
    if (!email || !projectName || !description || !developmentBoard || sensorCount === undefined) {
        return res.status(400).json({ message: 'All project fields are required.' });
    }
    const users = readUsersDB();
    const userIndex = users.findIndex(user => user.email === email);
    if (userIndex === -1) return res.status(404).json({ message: 'User not found.' });

    // Create initial sensor data slots
    const sensordata = [];
    for (let i = 1; i <= sensorCount; i++) {
        sensordata.push({
            id: `sensor_${i}`,
            title: `Sensor ${i}`,
            typeOfPin: 'Analog',
            pinNumber: `A${i-1}`,
            data: []
        });
    }

    const newProject = {
        projectName,
        description,
        developmentBoard,
        sensorCount: Number(sensorCount),
        token: uuidv4(),
        sensordata
    };

    if (!users[userIndex].projects) users[userIndex].projects = [];
    users[userIndex].projects.push(newProject);
    writeUsersDB(users);
    console.log(`Project created for ${users[userIndex].name}: ${projectName}`);
    res.status(201).json({ message: 'Project created successfully!', project: newProject });
});

// Get all projects for a user
app.get('/user-projects/:email', (req, res) => {
    const { email } = req.params;
    const users = readUsersDB();
    const user = users.find(u => u.email === email);
    if (user) {
        res.json(user.projects || []);
    } else {
        res.status(404).json({ message: 'User not found.' });
    }
});

// Get data for a specific project token
app.get('/data/:token', (req, res) => {
    const { token } = req.params;
    const users = readUsersDB();
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) {
            return res.json(project.sensordata || []);
        }
    }
    res.status(404).json({ message: 'Invalid project token.' });
});

// UPDATE SENSOR INFO
app.post('/update-sensor-info', (req, res) => {
    const { token, sensorId, title, typeOfPin, pinNumber } = req.body;
    if (!token || !sensorId || !title || !typeOfPin || !pinNumber) {
        return res.status(400).json({ message: 'All sensor fields are required.' });
    }

    const users = readUsersDB();
    let projectFound = false;
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) {
            const sensor = project.sensordata?.find(s => s.id === sensorId);
            if (sensor) {
                sensor.title = title;
                sensor.typeOfPin = typeOfPin;
                sensor.pinNumber = pinNumber;
                projectFound = true;
                break;
            }
        }
    }

    if (projectFound) {
        writeUsersDB(users);
        res.json({ message: 'Sensor updated successfully!' });
    } else {
        res.status(404).json({ message: 'Project or Sensor not found.' });
    }
});


// --- WebSocket Server ---
wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    ws.on('message', (message) => {
        try {
            const incomingData = JSON.parse(message);
            console.log('Received from ESP32:', incomingData);

            // --- Authentication Logic ---
            if (incomingData.token && incomingData.action === 'auth') {
                const users = readUsersDB();
                if (users.some(u => u.projects?.some(p => p.token === incomingData.token))) {
                    ws.isAuthenticated = true;
                    ws.token = incomingData.token;
                    ws.send(JSON.stringify({ status: 'authenticated' }));
                    console.log(`Device authenticated: ${ws.token.substring(0, 8)}...`);
                } else {
                    ws.send(JSON.stringify({ status: 'authentication failed' }));
                    ws.terminate();
                }
            } 
            // --- Data Saving Logic ---
            else if (ws.isAuthenticated && incomingData.action === 'data') {
                const users = readUsersDB();
                for (const user of users) {
                    const project = user.projects?.find(p => p.token === ws.token);
                    if (project) {
                        // incomingData.payload should be an array of sensor values, e.g., [25.5, 60.1]
                        const sensorValues = incomingData.payload;
                        
                        project.sensordata.forEach((sensor, index) => {
                            if (sensorValues[index] !== undefined) {
                                const newDataPoint = {
                                    datetime: new Date().toISOString(),
                                    value: sensorValues[index]
                                };
                                sensor.data.push(newDataPoint);
                                if (sensor.data.length > 100) sensor.data.shift();
                            }
                        });
                        
                        writeUsersDB(users);
                        console.log(`Saved data for project: ${project.projectName}`);
                        break; 
                    }
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
