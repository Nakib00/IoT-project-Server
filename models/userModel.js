const fs = require('fs');
const path = require('path');
const {
    v4: uuidv4
} = require('uuid');

const USERS_DB_PATH = path.join(__dirname, '..', 'users.json');

// Reads the entire user database from the JSON file.
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

// Writes the entire user database to the JSON file.
const writeUsersDB = (data) => {
    try {
        fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing to users database:", error);
    }
};

// Finds a user by their email address.
const findUserByEmail = (email) => {
    const users = readUsersDB();
    return users.find(user => user.email === email);
};

// Finds a user by their ID.
const findUserById = (userId) => {
    const users = readUsersDB();
    return users.find(user => user.id === userId);
};

// Creates a new user and saves it to the database.
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

// Creates a new project for a specific user.
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
        sendingsignal: [],
        convinesensorgraph: []
    };

    if (!users[userIndex].projects) {
        users[userIndex].projects = [];
    }
    users[userIndex].projects.push(newProject);
    writeUsersDB(users);
    return newProject;
};

// Finds a project by its ID across all users.
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

// Finds a project by its token across all users.
const findProjectByToken = (token) => {
    const users = readUsersDB();
    for (const user of users) {
        const project = user.projects?.find(p => p.token === token);
        if (project) return project;
    }
    return null;
};

// Updates a project's details by its ID.
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

// Deletes a project by its ID.
const deleteProjectById = (projectId) => {
    const users = readUsersDB();
    let projectFound = false;

    for (const user of users) {
        const projectIndex = user.projects?.findIndex(p => p.projectId === projectId);

        if (projectIndex > -1) {
            user.projects.splice(projectIndex, 1);
            projectFound = true;
            break;
        }
    }

    if (projectFound) {
        writeUsersDB(users);
        return true;
    }

    return false;
};

// Adds a new sensor to a project.
const addSensor = (projectId, sensorName) => {
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

// Creates a new sending signal group for a project.
const createSendingSignalForProject = (projectId, signalData) => {
    const users = readUsersDB();
    const user = users.find(u => u.projects.some(p => p.projectId === projectId));

    if (!user) return null;

    const project = user.projects.find(p => p.projectId === projectId);

    const newSignal = {
        id: uuidv4(),
        title: signalData.title,
        button: signalData.buttons.map(button => ({
            id: uuidv4(),
            title: button.title,
            type: button.type,
            pinnumber: button.pinnumber,
            sendingdata: button.sendingdata || [],
            releaseddata: button.releaseddata || "0",
            char: button.char,
            action: button.action,
            ondata: button.ondata,
            offdata: button.offdata,
            sensitivity: button.sensitivity,
            defaultState: button.defaultState,
        }))
    };

    if (!project.sendingsignal) {
        project.sendingsignal = [];
    }

    project.sendingsignal.push({
        signal: [newSignal]
    });
    project.updatedAt = new Date().toISOString();

    writeUsersDB(users);
    return newSignal;
};

// Updates the title of a sending signal.
const updateSendingSignalTitle = (signalId, newTitle) => {
    const users = readUsersDB();
    let signalFound = false;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    const signal = signalGroup.signal?.find(s => s.id === signalId);
                    if (signal) {
                        signal.title = newTitle;
                        project.updatedAt = new Date().toISOString();
                        signalFound = true;
                        break;
                    }
                }
            }
            if (signalFound) break;
        }
        if (signalFound) break;
    }

    if (signalFound) {
        writeUsersDB(users);
        return true;
    }

    return false;
};

// Deletes an entire sending signal group.
const deleteSendingSignal = (signalId) => {
    const users = readUsersDB();
    let signalFoundAndDeleted = false;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    const signalIndex = signalGroup.signal?.findIndex(s => s.id === signalId);
                    if (signalIndex > -1) {
                        signalGroup.signal.splice(signalIndex, 1);
                        project.updatedAt = new Date().toISOString();
                        signalFoundAndDeleted = true;
                        break;
                    }
                }
            }
            if (signalFoundAndDeleted) break;
        }
        if (signalFoundAndDeleted) break;
    }

    if (signalFoundAndDeleted) {
        writeUsersDB(users);
        return true;
    }

    return false;
};

// Adds a new button to an existing signal.
const addButtonToSignal = (signalId, buttonData) => {
    const users = readUsersDB();
    let buttonAdded = false;
    let newButton = null;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    const signal = signalGroup.signal?.find(s => s.id === signalId);
                    if (signal) {
                        newButton = {
                            id: uuidv4(),
                            ...buttonData
                        };
                        signal.button.push(newButton);
                        project.updatedAt = new Date().toISOString();
                        buttonAdded = true;
                        break;
                    }
                }
            }
            if (buttonAdded) break;
        }
        if (buttonAdded) break;
    }

    if (buttonAdded) {
        writeUsersDB(users);
        return newButton;
    }

    return null;
};


// Updates an existing button's information by its ID.
const updateButtonById = (buttonId, buttonData) => {
    const users = readUsersDB();
    let buttonFound = false;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    for (const signal of signalGroup.signal) {
                        const button = signal.button?.find(b => b.id === buttonId);
                        if (button) {
                            Object.assign(button, buttonData)
                            project.updatedAt = new Date().toISOString();
                            buttonFound = true;
                            break;
                        }
                    }
                }
            }
            if (buttonFound) break;
        }
        if (buttonFound) break;
    }

    if (buttonFound) {
        writeUsersDB(users);
        return true;
    }
    return false;
};

// Deletes a button from a signal by its ID.
const deleteButtonById = (buttonId) => {
    const users = readUsersDB();
    let buttonDeleted = false;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    for (const signal of signalGroup.signal) {
                        const buttonIndex = signal.button?.findIndex(b => b.id === buttonId);
                        if (buttonIndex > -1) {
                            signal.button.splice(buttonIndex, 1);
                            project.updatedAt = new Date().toISOString();
                            buttonDeleted = true;
                            break;
                        }
                    }
                }
            }
            if (buttonDeleted) break;
        }
        if (buttonDeleted) break;
    }

    if (buttonDeleted) {
        writeUsersDB(users);
        return true;
    }
    return false;
};


// Updates a sensor's information by its ID.
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

// Finds a sensor by its ID.
const findSensorById = (sensorId) => {
    const users = readUsersDB();
    for (const user of users) {
        for (const project of user.projects || []) {
            const sensor = project.sensordata?.find(s => s.id === sensorId);
            if (sensor) {
                return sensor;
            }
        }
    }
    return null;
};

// Deletes a sensor by its ID.
const deleteSensorById = (sensorId) => {
    const users = readUsersDB();
    let sensorFound = false;

    for (const user of users) {
        for (const project of user.projects || []) {
            const sensorIndex = project.sensordata?.findIndex(s => s.id === sensorId);

            if (sensorIndex > -1) {
                project.sensordata.splice(sensorIndex, 1);
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

// Updates the graph information for a sensor.
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
        Object.assign(sensorToUpdate.graphInfo, graphData);

        const now = new Date().toISOString();
        sensorToUpdate.updatedAt = now;
        parentProject.updatedAt = now;

        writeUsersDB(users);
        return sensorToUpdate;
    }

    return null;
};

// Adds a new data point to a sensor's data array.
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

// Updates an existing button's releaseddata after validation.
const updateButtonAndValidateReleasedData = (buttonId, newReleasedData) => {
    const users = readUsersDB();
    let buttonFound = false;

    for (const user of users) {
        for (const project of user.projects) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    for (const signal of signalGroup.signal) {
                        const button = signal.button?.find(b => b.id === buttonId);
                        if (button) {
                            // Validation: Check if newReleasedData is in the sendingdata array
                            if (!button.sendingdata || !button.sendingdata.includes(newReleasedData)) {
                                return {
                                    success: false,
                                    message: `Invalid input. The value for releaseddata must be one of: [${button.sendingdata.join(', ')}]`
                                };
                            }

                            // Update the releaseddata
                            button.releaseddata = newReleasedData;
                            project.updatedAt = new Date().toISOString();
                            buttonFound = true;
                            break;
                        }
                    }
                }
            }
            if (buttonFound) break;
        }
        if (buttonFound) break;
    }

    if (buttonFound) {
        writeUsersDB(users);
        return {
            success: true
        };
    }

    return {
        success: false,
        message: 'Button not found.'
    };
};

const findProjectByButtonId = (buttonId) => {
    const users = readUsersDB();
    for (const user of users) {
        for (const project of user.projects || []) {
            if (project.sendingsignal) {
                for (const signalGroup of project.sendingsignal) {
                    for (const signal of signalGroup.signal) {
                        const button = signal.button?.find(b => b.id === buttonId);
                        if (button) {
                            return project;
                        }
                    }
                }
            }
        }
    }
    return null;
};

// Creates a new combined sensor graph for a project.
const createCombinedSensorGraphForProject = (projectId, title, sensorIds) => {
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

    if (!projectToUpdate) {
        return {
            success: false,
            status: 404,
            message: 'Project not found.'
        };
    }

    const sensorsInProject = projectToUpdate.sensordata || [];
    const includedSensors = [];

    for (const sensorId of sensorIds) {
        const sensor = sensorsInProject.find(s => s.id === sensorId);
        if (!sensor) {
            return {
                success: false,
                status: 400,
                message: `Sensor with ID "${sensorId}" not found in this project.`
            };
        }
        includedSensors.push({
            sensorid: sensor.id,
            sensorTitle: sensor.title
        });
    }

    const newCombinedGraph = {
        id: uuidv4(),
        title: title,
        sensors: includedSensors,
        convinegraphInfo: {
            title: `Combined: ${title}`,
            type: 'line',
            maxDataPoints: 20,
            xAxisLabel: 'Time',
            yAxisLabel: 'Values'
        }
    };

    if (!projectToUpdate.convinesensorgraph) {
        projectToUpdate.convinesensorgraph = [];
    }

    projectToUpdate.convinesensorgraph.push(newCombinedGraph);
    projectToUpdate.updatedAt = new Date().toISOString();

    writeUsersDB(users);

    return {
        success: true,
        data: newCombinedGraph
    };
};

// Finds the project and the combined graph object by the graph's ID.
const findProjectByCombinedGraphId = (graphId) => {
    const users = readUsersDB();
    for (const user of users) {
        for (const project of user.projects || []) {
            const combinedGraph = project.convinesensorgraph?.find(g => g.id === graphId);
            if (combinedGraph) {
                return {
                    user,
                    project,
                    combinedGraph
                };
            }
        }
    }
    return {
        user: null,
        project: null,
        combinedGraph: null
    };
};

// Calculates the average for a combined sensor graph based on filter criteria.
const calculateCombinedGraphAverage = (graphId, options) => {
    const {
        dataType,
        value
    } = options;

    const {
        project,
        combinedGraph
    } = findProjectByCombinedGraphId(graphId);

    if (!project || !combinedGraph) {
        return {
            success: false,
            status: 404,
            message: 'Combined graph not found.'
        };
    }

    const averageResults = [];
    const allSensorsInProject = project.sensordata || [];
    const sensorIdsInGraph = combinedGraph.sensors.map(s => s.sensorid);

    for (const sensorId of sensorIdsInGraph) {
        const sensor = allSensorsInProject.find(s => s.id === sensorId);
        if (!sensor || !sensor.data || sensor.data.length === 0) {
            averageResults.push({
                sensorId: sensorId,
                title: sensor ? sensor.title : 'Unknown Sensor',
                average: 0,
                note: 'Sensor not found or has no data.'
            });
            continue;
        }

        let dataToAverage = [];
        const now = new Date();

        switch (dataType) {
            case 'realtime':
                dataToAverage = sensor.data.slice(-1); // Get the last element
                break;

            case 'count':
                dataToAverage = sensor.data.slice(-value); // Get the last 'value' elements
                break;

            case 'today':
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                dataToAverage = sensor.data.filter(d => new Date(d.datetime) >= startOfDay);
                break;

            case 'days':
                const startDate = new Date(now);
                startDate.setDate(now.getDate() - value);
                dataToAverage = sensor.data.filter(d => new Date(d.datetime) >= startDate);
                break;
        }

        let average = 0;
        if (dataToAverage.length > 0) {
            const sum = dataToAverage.reduce((acc, curr) => acc + curr.value, 0);
            average = sum / dataToAverage.length;
        }

        averageResults.push({
            sensorId: sensor.id,
            title: sensor.title,
            average: parseFloat(average.toFixed(2)) // Format to 2 decimal places
        });
    }

    // --- Update the convinegraphInfo with the last used filter ---
    if (combinedGraph.convinegraphInfo) {
        combinedGraph.convinegraphInfo.lastFilter = {
            dataType,
            value: value || null,
            queriedAt: new Date().toISOString()
        };
    }
    // Find the user and project again to write the changes
    const users = readUsersDB();
    const user = users.find(u => u.id === project.ownerId); // Assuming you add an ownerId to projects
    if (user) {
        const projectIndex = user.projects.findIndex(p => p.projectId === project.projectId);
        if (projectIndex !== -1) {
            const graphIndex = user.projects[projectIndex].convinesensorgraph.findIndex(g => g.id === graphId);
            if (graphIndex !== -1) {
                user.projects[projectIndex].convinesensorgraph[graphIndex] = combinedGraph;
                writeUsersDB(users);
            }
        }
    }


    return {
        success: true,
        data: {
            graphTitle: combinedGraph.title,
            averages: averageResults
        }
    };
};

// Fetches and calculates data for a combined graph by its ID.
const getCombinedGraphDataById = (graphId, options = {}) => {
    const {
        startDate,
        endDate
    } = options;
    const {
        project,
        combinedGraph
    } = findProjectByCombinedGraphId(graphId);

    if (!project || !combinedGraph) {
        return {
            success: false,
            status: 404,
            message: 'Combined graph not found.'
        };
    }

    const maxDataPoints = combinedGraph.convinegraphInfo?.maxDataPoints || 10; // Default to 10 if not set
    const calculatedData = [];
    const allSensorsInProject = project.sensordata || [];
    const sensorIdsInGraph = combinedGraph.sensors.map(s => s.sensorid);

    for (const sensorId of sensorIdsInGraph) {
        const sensor = allSensorsInProject.find(s => s.id === sensorId);
        if (!sensor || !sensor.data || sensor.data.length === 0) {
            calculatedData.push({
                sensorId: sensorId,
                title: sensor ? sensor.title : 'Unknown Sensor',
                average: 0,
                dataPointCount: 0,
                note: 'Sensor not found or has no data.'
            });
            continue;
        }

        let filteredData = sensor.data;

        // Apply date filtering if parameters are provided
        if (startDate) {
            filteredData = filteredData.filter(d => new Date(d.datetime) >= new Date(startDate));
        }
        if (endDate) {
            filteredData = filteredData.filter(d => new Date(d.datetime) <= new Date(endDate));
        }

        // Get the last `maxDataPoints` from the (potentially filtered) data
        const dataToAverage = filteredData.slice(-maxDataPoints);

        let average = 0;
        if (dataToAverage.length > 0) {
            const sum = dataToAverage.reduce((acc, curr) => acc + curr.value, 0);
            average = sum / dataToAverage.length;
        }

        calculatedData.push({
            sensorId: sensor.id,
            title: sensor.title,
            average: parseFloat(average.toFixed(2)),
            dataPointCount: dataToAverage.length
        });
    }

    // --- THIS IS THE MODIFIED PART ---
    // The response now includes the graph's configuration info.
    return {
        success: true,
        data: {
            graphTitle: combinedGraph.title,
            convinegraphInfo: combinedGraph.convinegraphInfo, // <-- ADDED THIS LINE
            results: calculatedData
        }
    };
};

// Updates a combined graph's title and sensor list.
const updateCombinedGraphById = (graphId, updateData) => {
    const {
        title,
        sensorIds
    } = updateData;
    const users = readUsersDB();
    let wasUpdated = false;
    let updatedGraph = null;

    for (const user of users) {
        for (const project of user.projects || []) {
            const graphIndex = project.convinesensorgraph?.findIndex(g => g.id === graphId);
            if (graphIndex > -1) {
                const graphToUpdate = project.convinesensorgraph[graphIndex];

                // Update title if provided
                if (title) {
                    graphToUpdate.title = title;
                    if (graphToUpdate.convinegraphInfo) {
                        graphToUpdate.convinegraphInfo.title = `Combined: ${title}`;
                    }
                }

                // Update sensor list if provided
                if (sensorIds && Array.isArray(sensorIds)) {
                    const projectSensors = project.sensordata || [];
                    const newSensorList = [];
                    for (const sId of sensorIds) {
                        const sensorExists = projectSensors.find(ps => ps.id === sId);
                        if (!sensorExists) {
                            return {
                                success: false,
                                status: 400,
                                message: `Sensor with ID "${sId}" does not exist in this project.`
                            };
                        }
                        newSensorList.push({
                            sensorid: sensorExists.id,
                            sensorTitle: sensorExists.title
                        });
                    }
                    graphToUpdate.sensors = newSensorList;
                }

                project.updatedAt = new Date().toISOString();
                wasUpdated = true;
                updatedGraph = graphToUpdate;
                break;
            }
        }
        if (wasUpdated) break;
    }

    if (!wasUpdated) {
        return {
            success: false,
            status: 404,
            message: 'Combined graph not found.'
        };
    }

    writeUsersDB(users);
    return {
        success: true,
        data: updatedGraph
    };
};

// Deletes a combined graph by its ID.
const deleteCombinedGraphById = (graphId) => {
    const users = readUsersDB();
    let wasDeleted = false;

    for (const user of users) {
        for (const project of user.projects || []) {
            const graphIndex = project.convinesensorgraph?.findIndex(g => g.id === graphId);

            if (graphIndex > -1) {
                project.convinesensorgraph.splice(graphIndex, 1);
                project.updatedAt = new Date().toISOString();
                wasDeleted = true;
                break;
            }
        }
        if (wasDeleted) break;
    }

    if (wasDeleted) {
        writeUsersDB(users);
    }

    return wasDeleted;
};
// Updates the convinegraphInfo of a combined graph.
const updateCombinedGraphInfoById = (graphId, newInfo) => {
    const users = readUsersDB();
    let wasUpdated = false;
    let updatedGraphInfo = null;

    for (const user of users) {
        for (const project of user.projects || []) {
            const graph = project.convinesensorgraph?.find(g => g.id === graphId);

            if (graph) {
                // Ensure convinegraphInfo exists
                if (!graph.convinegraphInfo) {
                    graph.convinegraphInfo = {};
                }

                // Merge the new data into the existing info
                Object.assign(graph.convinegraphInfo, newInfo);

                project.updatedAt = new Date().toISOString();
                wasUpdated = true;
                updatedGraphInfo = graph.convinegraphInfo;
                break;
            }
        }
        if (wasUpdated) break;
    }

    if (!wasUpdated) {
        return {
            success: false,
            status: 404,
            message: 'Combined graph not found.'
        };
    }

    writeUsersDB(users);
    return {
        success: true,
        data: updatedGraphInfo
    };
};


module.exports = {
    readUsersDB,
    updateCombinedGraphInfoById,
    getCombinedGraphDataById,
    updateCombinedGraphById,
    deleteCombinedGraphById,
    getCombinedGraphDataById,
    findUserByEmail,
    findUserById,
    findProjectById,
    findSensorById,
    createUser,
    createProjectForUser,
    createSendingSignalForProject,
    updateSendingSignalTitle,
    deleteSendingSignal,
    addButtonToSignal,
    updateButtonById,
    deleteButtonById,
    updateProjectById,
    deleteProjectById,
    addSensor,
    updateSensorById,
    calculateCombinedGraphAverage,
    deleteSensorById,
    updateGraphInfoById,
    findProjectByToken,
    addDataToSensor,
    updateButtonAndValidateReleasedData,
    findProjectByButtonId,
    updateButtonAndValidateReleasedData,
    createCombinedSensorGraphForProject
};
