const fs = require('fs');
const path = require('path');
const {
    v4: uuidv4
} = require('uuid');

const USERS_DB_PATH = path.join(__dirname, '..', 'users.json');

const readUsersDB = () => {
    try {
        if (!fs.existsSync(USERS_DB_PATH)) {
            fs.writeFileSync(USERS_DB_PATH, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        console.error("Error reading users database:", error);
        return [];
    }
};

const writeUsersDB = (data) => {
    try {
        fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing to users database:", error);
    }
};

const findUserByEmail = (email) => {
    const users = readUsersDB();
    return users.find(user => user.email === email);
};

const createProjectForUser = (email, projectData) => {
    const users = readUsersDB();
    const userIndex = users.findIndex(user => user.email === email);
    if (userIndex === -1) return null;

    const sensordata = Array.from({
        length: projectData.sensorCount
    }, (_, i) => ({
        id: `sensor_${i + 1}`,
        title: `Sensor ${i + 1}`,
        typeOfPin: 'Analog',
        pinNumber: `A${i}`,
        data: [],
    }));

    const newProject = {
        ...projectData,
        token: uuidv4(),
        sensordata,
    };

    if (!users[userIndex].projects) {
        users[userIndex].projects = [];
    }
    users[userIndex].projects.push(newProject);
    writeUsersDB(users);
    return newProject;
};

const findProjectByToken = (token) => {
    const users = readUsersDB();
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) return project;
    }
    return null;
};

const updateSensorInfoForProject = (token, sensorId, sensorData) => {
    const users = readUsersDB();
    let updated = false;
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) {
            const sensor = project.sensordata?.find(s => s.id === sensorId);
            if (sensor) {
                Object.assign(sensor, sensorData);
                updated = true;
                break;
            }
        }
    }
    if (updated) writeUsersDB(users);
    return updated;
};


const addDataToSensor = (token, payload) => {
    const users = readUsersDB();
    let projectFound = false;

    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) {
            projectFound = true;
            for (const pin in payload) {
                const sensor = project.sensordata.find(s => s.pinNumber === pin);
                if (sensor) {
                    const newDataPoint = {
                        datetime: new Date().toISOString(),
                        value: payload[pin]
                    };
                    sensor.data.push(newDataPoint);
                    // Keep the data array from growing indefinitely
                    if (sensor.data.length > 100) {
                        sensor.data.shift();
                    }
                }
            }
            break;
        }
    }

    if (projectFound) {
        writeUsersDB(users);
    }

    return projectFound;
};

module.exports = {
    readUsersDB,
    findUserByEmail,
    createProjectForUser,
    findProjectByToken,
    updateSensorInfoForProject,
    addDataToSensor,
};