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

const findUserById = (userId) => {
    const users = readUsersDB();
    return users.find(user => user.id === userId);
};

const createUser = (userData) => {
    const users = readUsersDB();
    const newUser = {
        id: uuidv4(),
        ...userData,
        projects: []
    };
    users.push(newUser);
    writeUsersDB(users);
    return newUser;
};

const createProjectForUser = (userId, projectData) => {
    const users = readUsersDB();
    const userIndex = users.findIndex(user => user.id === userId);
    if (userIndex === -1) return null;

    const newProject = {
        projectId: uuidv4(),
        ...projectData,
        token: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sensordata: [],
    };

    if (!users[userIndex].projects) {
        users[userIndex].projects = [];
    }
    users[userIndex].projects.push(newProject);
    writeUsersDB(users);
    return newProject;
};

const findProjectById = (projectId) => {
    const users = readUsersDB();
    for (const user of users) {
        const project = user.projects?.find(p => p.projectId === projectId);
        if (project) {
            return project;
        }
    }
    return null;
};

const findProjectByToken = (token) => {
    const users = readUsersDB();
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) return project;
    }
    return null;
};

const updateProjectById = (projectId, projectData) => {
    const users = readUsersDB();
    let projectToUpdate = null;

    for (const user of users) {
        const project = user.projects?.find(p => p.projectId === projectId);
        if (project) {
            projectToUpdate = project;
            break;
        }
    }

    if (projectToUpdate) {
        Object.assign(projectToUpdate, projectData);
        projectToUpdate.updatedAt = new Date().toISOString();
        writeUsersDB(users);
        return projectToUpdate;
    }

    return null;
};

const deleteProjectById = (projectId) => {
    const users = readUsersDB();
    let projectFound = false;

    for (const user of users) {
        const projectIndex = user.projects?.findIndex(p => p.projectId === projectId);

        if (projectIndex > -1) {
            // Remove the project from the user's projects array
            user.projects.splice(projectIndex, 1);
            projectFound = true;
            break; // Exit after finding and deleting the project
        }
    }

    if (projectFound) {
        writeUsersDB(users);
        return true;
    }

    return false;
};


const addSensor = (projectId, sensorName) => {
    const users = readUsersDB();
    let projectToUpdate = null;
    let userOfProject = null;

    for (const user of users) {
        const project = user.projects?.find(p => p.projectId === projectId);
        if (project) {
            projectToUpdate = project;
            userOfProject = user;
            break;
        }
    }

    if (projectToUpdate) {
        const newSensor = {
            id: uuidv4(),
            title: sensorName,
            typeOfPin: 'Analog',
            pinNumber: 'A0',
            graphInfo: {
                title: `Real-time ${sensorName} Data`,
                type: 'line',
                maxDataPoints: 10,
                xAxisLabel: 'Time',
                yAxisLabel: 'Value',
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: [],
        };

        if (!projectToUpdate.sensordata) {
            projectToUpdate.sensordata = [];
        }

        projectToUpdate.sensordata.push(newSensor);
        projectToUpdate.updatedAt = new Date().toISOString();

        writeUsersDB(users);
        return newSensor;
    }

    return null;
};

const updateSensorById = (sensorId, sensorData) => {
    const users = readUsersDB();
    let sensorToUpdate = null;
    let parentProject = null;

    for (const user of users) {
        for (const project of user.projects || []) {
            const sensor = project.sensordata?.find(s => s.id === sensorId);
            if (sensor) {
                sensorToUpdate = sensor;
                parentProject = project;
                break;
            }
        }
        if (sensorToUpdate) break;
    }

    if (sensorToUpdate) {
        Object.assign(sensorToUpdate, sensorData);
        const now = new Date().toISOString();
        sensorToUpdate.updatedAt = now;
        parentProject.updatedAt = now; 

        writeUsersDB(users);
        return sensorToUpdate;
    }

    return null;
};

const deleteSensorById = (sensorId) => {
    const users = readUsersDB();
    let sensorFound = false;

    for (const user of users) {
        for (const project of user.projects || []) {
            const sensorIndex = project.sensordata?.findIndex(s => s.id === sensorId);

            if (sensorIndex > -1) {
                // Remove the sensor from the array
                project.sensordata.splice(sensorIndex, 1);
                // Update the project's timestamp
                project.updatedAt = new Date().toISOString();
                sensorFound = true;
                break;
            }
        }
        if (sensorFound) break;
    }

    if (sensorFound) {
        writeUsersDB(users);
        return true;
    }

    return false;
};


const updateGraphInfoById = (sensorId, graphData) => {
    const users = readUsersDB();
    let sensorToUpdate = null;
    let parentProject = null;

    for (const user of users) {
        for (const project of user.projects || []) {
            const sensor = project.sensordata?.find(s => s.id === sensorId);
            if (sensor) {
                sensorToUpdate = sensor;
                parentProject = project;
                break;
            }
        }
        if (sensorToUpdate) break;
    }

    if (sensorToUpdate) {
        // Merge the new data into the existing graphInfo object
        Object.assign(sensorToUpdate.graphInfo, graphData);

        const now = new Date().toISOString();
        sensorToUpdate.updatedAt = now;
        parentProject.updatedAt = now;

        writeUsersDB(users);
        return sensorToUpdate;
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
                project.updatedAt = new Date().toISOString();
                updated = true;
                break;
            }
        }
    }
    if (updated) writeUsersDB(users);
    return updated;
};


// This function adds data to a sensor based on the token and payload provided.
// It finds the project by token, updates the sensor's data, and ensures the data array
const addDataToSensor = (token, payload) => {
    const users = readUsersDB();
    let projectFound = false;

    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) {
            projectFound = true;
            project.updatedAt = new Date().toISOString();
            for (const pin in payload) {
                const sensor = project.sensordata.find(s => s.pinNumber === pin);
                if (sensor) {
                    const newDataPoint = {
                        datetime: new Date().toISOString(),
                        value: payload[pin]
                    };
                    sensor.data.push(newDataPoint);
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
    findUserById,
    findProjectById,
    createUser,
    createProjectForUser,
    updateProjectById,
    deleteProjectById,
    addSensor,
    updateSensorById,
    deleteSensorById,
    updateGraphInfoById,
    findProjectByToken,
    updateSensorInfoForProject,
    addDataToSensor,
};