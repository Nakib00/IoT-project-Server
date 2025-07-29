const UserModel = require('../models/userModel');
const {
    formatResponse
} = require('../utils/responseFormatter');

// Creates a new project for a user.
const createProject = (req, res) => {
    const {
        userId
    } = req.params;
    const {
        projectName,
        description,
        developmentBoard
    } = req.body;
    const newProject = UserModel.createProjectForUser(userId, {
        projectName,
        description,
        developmentBoard,
    });
    if (newProject) {
        res.status(201).json(formatResponse(true, 201, 'Project created successfully!', {
            project: newProject
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'User not found.'));
    }
};

// Creates a new sending signal group within a project.
const createSendingSignal = (req, res) => {
    const {
        projectId
    } = req.params;
    const {
        title,
        buttons
    } = req.body;

    if (!title || !buttons || !Array.isArray(buttons) || buttons.length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'Request body must contain a title and a non-empty array of buttons.'));
    }

    // Validate button types
    const validButtonTypes = ['momentary', 'toggle', 'touch'];
    for (const button of buttons) {
        if (!validButtonTypes.includes(button.type)) {
            return res.status(400).json(formatResponse(false, 400, `Invalid button type: ${button.type}. Must be one of 'momentary', 'toggle', or 'touch'.`));
        }
    }

    const newSignal = UserModel.createSendingSignalForProject(projectId, {
        title,
        buttons
    });

    if (newSignal) {
        res.status(201).json(formatResponse(true, 201, 'Sending signal created successfully!', {
            signal: newSignal
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};
// Updates the title of a sending signal.
const updateSignalTitle = (req, res) => {
    const {
        signalId
    } = req.params;
    const {
        title
    } = req.body;

    if (!title) {
        return res.status(400).json(formatResponse(false, 400, 'The "title" field is required.'));
    }

    const wasUpdated = UserModel.updateSendingSignalTitle(signalId, title);

    if (wasUpdated) {
        res.status(200).json(formatResponse(true, 200, 'Signal title updated successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Signal not found.'));
    }
};

// Deletes an entire sending signal group.
const deleteSignal = (req, res) => {
    const {
        signalId
    } = req.params;

    const wasDeleted = UserModel.deleteSendingSignal(signalId);

    if (wasDeleted) {
        res.status(200).json(formatResponse(true, 200, 'Signal deleted successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Signal not found.'));
    }
};

// Adds a new button to an existing signal.
const addButton = (req, res) => {
    const {
        signalId
    } = req.params;
    const {
        title,
        type,
        pinnumber,
        sendingdata,
        releaseddata,
    } = req.body;

    if (!title || !type || !pinnumber) {
        return res.status(400).json(formatResponse(false, 400, 'Fields "title", "type", and "pinnumber" are required.'));
    }

    const validButtonTypes = ['momentary', 'toggle', 'touch'];
    if (!validButtonTypes.includes(type)) {
        return res.status(400).json(formatResponse(false, 400, `Invalid button type: ${type}. Must be one of 'momentary', 'toggle', or 'touch'.`));
    }

    const newButton = UserModel.addButtonToSignal(signalId, {
        title,
        type,
        pinnumber,
        sendingdata,
        releaseddata,
    });

    if (newButton) {
        res.status(201).json(formatResponse(true, 201, 'Button added successfully!', {
            button: newButton
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Signal not found.'));
    }
};

// Updates an existing button's information.
const updateButton = (req, res) => {
    const {
        buttonId
    } = req.params;
    const buttonData = req.body;

    if (Object.keys(buttonData).length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'At least one field to update is required.'));
    }

    if (buttonData.type) {
        const validButtonTypes = ['momentary', 'toggle', 'touch'];
        if (!validButtonTypes.includes(buttonData.type)) {
            return res.status(400).json(formatResponse(false, 400, `Invalid button type: ${buttonData.type}. Must be one of 'momentary', 'toggle', or 'touch'.`));
        }
    }


    const wasUpdated = UserModel.updateButtonById(buttonId, buttonData);

    if (wasUpdated) {
        res.status(200).json(formatResponse(true, 200, 'Button updated successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Button not found.'));
    }
};

// Deletes a button from a signal.
const deleteButton = (req, res) => {
    const {
        buttonId
    } = req.params;
    const wasDeleted = UserModel.deleteButtonById(buttonId);

    if (wasDeleted) {
        res.status(200).json(formatResponse(true, 200, 'Button deleted successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Button not found.'));
    }
};

// Fetches all projects for a given user.
const getUserProjects = (req, res) => {
    const {
        userId
    } = req.params;
    const user = UserModel.findUserById(userId);

    if (user) {
        const sortedProjects = (user.projects || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const formattedProjects = sortedProjects.map(p => ({
            projectId: p.projectId,
            projectName: p.projectName,
            description: p.description,
            developmentBoard: p.developmentBoard,
            totalsensor: (p.sensordata || []).length,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
            sensors: (p.sensordata || []).map(s => ({
                id: s.id,
                title: s.title,
            })),
        }));

        res.json(formatResponse(true, 200, 'Projects fetched successfully', {
            projects: formattedProjects
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'User not found.'));
    }
};

// Fetches a single project by its ID.
const getProjectById = (req, res) => {
    const {
        projectId
    } = req.params;
    const project = UserModel.findProjectById(projectId);

    if (project) {
        res.json(formatResponse(true, 200, 'Project fetched successfully', {
            project
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};

// Updates a project's details.
const updateProject = (req, res) => {
    const {
        projectId
    } = req.params;
    const {
        projectName,
        description,
        developmentBoard
    } = req.body;

    const projectData = {};
    if (projectName) projectData.projectName = projectName;
    if (description) projectData.description = description;
    if (developmentBoard) projectData.developmentBoard = developmentBoard;

    if (Object.keys(projectData).length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'No fields to update provided.'));
    }

    const updatedProject = UserModel.updateProjectById(projectId, projectData);

    if (updatedProject) {
        res.status(200).json(formatResponse(true, 200, 'Project updated successfully!', {
            project: updatedProject
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};

// Deletes a project by its ID.
const deleteProjectById = (req, res) => {
    const {
        projectId
    } = req.params;
    const wasDeleted = UserModel.deleteProjectById(projectId);

    if (wasDeleted) {
        res.status(200).json(formatResponse(true, 200, 'Project deleted successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};

// Adds a new sensor to a project.
const addSensorToProject = (req, res) => {
    const {
        projectId
    } = req.params;
    const {
        sensorName
    } = req.body;

    if (!sensorName) {
        return res.status(400).json(formatResponse(false, 400, 'The "sensorName" field is required.'));
    }

    const newSensor = UserModel.addSensor(projectId, sensorName);

    if (newSensor) {
        res.status(201).json(formatResponse(true, 201, 'Sensor added successfully!', {
            sensor: newSensor
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};

// Updates a sensor's information.
const updateSensorInfo = (req, res) => {
    const {
        sensorId
    } = req.params;
    const {
        title,
        typeOfPin,
        pinNumber
    } = req.body;

    const sensorData = {};
    if (title) sensorData.title = title;
    if (typeOfPin) sensorData.typeOfPin = typeOfPin;
    if (pinNumber) sensorData.pinNumber = pinNumber;

    if (Object.keys(sensorData).length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'At least one field (title, typeOfPin, pinNumber) is required.'));
    }
    if (typeOfPin && !['Analog', 'Digital'].includes(typeOfPin)) {
        return res.status(400).json(formatResponse(false, 400, 'typeOfPin must be either "Analog" or "Digital".'));
    }

    const updatedSensor = UserModel.updateSensorById(sensorId, sensorData);

    if (updatedSensor) {
        res.status(200).json(formatResponse(true, 200, 'Sensor updated successfully!', {
            sensor: updatedSensor
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Sensor not found.'));
    }
};

// Fetches a single sensor by its ID.
const getSensorById = (req, res) => {
    const {
        sensorId
    } = req.params;
    const sensor = UserModel.findSensorById(sensorId);

    if (sensor) {
        if (sensor.data && Array.isArray(sensor.data)) {
            sensor.data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        }

        res.json(formatResponse(true, 200, 'Sensor data fetched successfully', {
            sensor
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Sensor not found.'));
    }
};

// Fetches all sensors for a given project.
const getProjectSensors = (req, res) => {
    const {
        projectId
    } = req.params;
    const project = UserModel.findProjectById(projectId);

    if (project) {
        const sensors = (project.sensordata || []).map(sensor => ({
            id: sensor.id,
            title: sensor.title,
        }));
        res.json(formatResponse(true, 200, 'Sensors fetched successfully', {
            sensors
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project not found.'));
    }
};


// Deletes a sensor by its ID.
const deleteSensorById = (req, res) => {
    const {
        sensorId
    } = req.params;
    const wasDeleted = UserModel.deleteSensorById(sensorId);

    if (wasDeleted) {
        res.status(200).json(formatResponse(true, 200, 'Sensor deleted successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Sensor not found.'));
    }
};

// Updates the graph information for a sensor.
const updateGraphInfo = (req, res) => {
    const {
        sensorId
    } = req.params;
    const {
        title,
        type,
        maxDataPoints,
        xAxisLabel,
        yAxisLabel
    } = req.body;

    const graphData = {};
    if (title) graphData.title = title;
    if (type) graphData.type = type;
    if (maxDataPoints) graphData.maxDataPoints = Number(maxDataPoints);
    if (xAxisLabel) graphData.xAxisLabel = xAxisLabel;
    if (yAxisLabel) graphData.yAxisLabel = yAxisLabel;

    if (Object.keys(graphData).length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'At least one graph info field is required.'));
    }

    if (type) {
        const validTypes = ['line', 'bar', 'scatter', 'area', 'composed'];
        if (!validTypes.includes(type)) {
            return res.status(400).json(formatResponse(false, 400, `Invalid graph type. Must be one of: ${validTypes.join(', ')}.`));
        }
    }

    const updatedSensor = UserModel.updateGraphInfoById(sensorId, graphData);

    if (updatedSensor) {
        res.status(200).json(formatResponse(true, 200, 'Graph info updated successfully!', {
            graphInfo: updatedSensor.graphInfo
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Sensor not found.'));
    }
};

// Fetches data for a project using its token.
const getProjectData = (req, res) => {
    const {
        token
    } = req.params;
    const project = UserModel.findProjectByToken(token);
    if (project) {
        res.json(formatResponse(true, 200, 'Data fetched successfully', {
            sensordata: project.sensordata || []
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Invalid project token.'));
    }
};

// Updates the releaseddata of a button by its ID.

const updateButtonReleasedData = (req, res) => {
    const {
        buttonId
    } = req.params;
    const {
        releaseddata
    } = req.body;

    if (typeof releaseddata === 'undefined') {
        return res.status(400).json(formatResponse(false, 400, 'The "releaseddata" field is required.'));
    }

    const result = UserModel.updateButtonAndValidateReleasedData(buttonId, releaseddata);

    if (result.success) {
        // --- WebSocket Push ---
        const wss = req.app.get('wss');
        const project = UserModel.findProjectByButtonId(buttonId);

        if (project && wss) {
            wss.clients.forEach((client) => {
                // Check if the client is authenticated and belongs to the correct project
                if (client.readyState === WebSocket.OPEN && client.isAuthenticated && client.token === project.token) {
                    const message = JSON.stringify({
                        action: 'releaseddata_update',
                        buttonId: buttonId,
                        releaseddata: releaseddata
                    });
                    client.send(message);
                    console.log(`Sent update to device for project token: ${project.token.substring(0, 8)}...`);
                }
            });
        }
        // --- End WebSocket Push ---

        res.status(200).json(formatResponse(true, 200, 'Button releaseddata updated successfully.'));
    } else {
        res.status(400).json(formatResponse(false, 400, result.message));
    }
};


// Creates a new combined sensor graph for a project.
const createCombinedSensorGraph = (req, res) => {
    const {
        projectId
    } = req.params;
    const {
        title,
        sensorIds
    } = req.body;

    if (!title || !sensorIds || !Array.isArray(sensorIds) || sensorIds.length === 0) {
        return res.status(400).json(formatResponse(false, 400, 'Request must include a "title" and a non-empty array of "sensorIds".'));
    }

    const result = UserModel.createCombinedSensorGraphForProject(projectId, title, sensorIds);

    if (!result.success) {
        return res.status(result.status).json(formatResponse(false, result.status, result.message));
    }

    res.status(201).json(formatResponse(true, 201, 'Combined sensor graph created successfully!', {
        combinedGraph: result.data
    }));
};

// Calculates and returns the average data for a combined sensor graph.
const getCombinedGraphAverage = (req, res) => {
    const {
        graphId
    } = req.params;
    const {
        dataType,
        value
    } = req.body;

    // --- Validation ---
    if (!dataType) {
        return res.status(400).json(formatResponse(false, 400, 'The "dataType" field is required.'));
    }

    const validDataTypes = ['count', 'days', 'today', 'realtime'];
    if (!validDataTypes.includes(dataType)) {
        return res.status(400).json(formatResponse(false, 400, `Invalid dataType. Must be one of: ${validDataTypes.join(', ')}.`));
    }

    if ((dataType === 'count' || dataType === 'days') && (typeof value !== 'number' || value <= 0)) {
        return res.status(400).json(formatResponse(false, 400, `The "value" field must be a positive number for dataType '${dataType}'.`));
    }
    // --- End Validation ---

    const result = UserModel.calculateCombinedGraphAverage(graphId, {
        dataType,
        value
    });

    if (!result.success) {
        return res.status(result.status || 404).json(formatResponse(false, result.status || 404, result.message));
    }

    res.status(200).json(formatResponse(true, 200, 'Average data calculated successfully!', result.data));
};

// Fetches and calculates data for a combined graph based on its settings.
const getCombinedGraphData = (req, res) => {
    const {
        graphId
    } = req.params;
    const {
        startDate,
        endDate
    } = req.query; // Get optional query parameters

    const result = UserModel.getCombinedGraphDataById(graphId, {
        startDate,
        endDate
    });

    if (!result.success) {
        return res.status(result.status || 404).json(formatResponse(false, result.status || 404, result.message));
    }

    res.status(200).json(formatResponse(true, 200, 'Combined graph data fetched successfully!', result.data));
};

// Updates a combined graph's title and/or sensor list.
const updateCombinedGraph = (req, res) => {
    const {
        graphId
    } = req.params;
    const {
        title,
        sensorIds
    } = req.body;

    if (!title && !sensorIds) {
        return res.status(400).json(formatResponse(false, 400, 'Request body must contain either "title" or "sensorIds".'));
    }

    const result = UserModel.updateCombinedGraphById(graphId, {
        title,
        sensorIds
    });

    if (!result.success) {
        return res.status(result.status || 404).json(formatResponse(false, result.status || 404, result.message));
    }

    res.status(200).json(formatResponse(true, 200, 'Combined graph updated successfully!', {
        updatedGraph: result.data
    }));
};

// Deletes a combined graph by its ID.
const deleteCombinedGraph = (req, res) => {
    const {
        graphId
    } = req.params;
    const wasDeleted = UserModel.deleteCombinedGraphById(graphId);

    if (wasDeleted) {
        res.status(200).json(formatResponse(true, 200, 'Combined graph deleted successfully.'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Combined graph not found.'));
    }
};



module.exports = {
    createProject,
    getCombinedGraphData,
    deleteCombinedGraph,
    updateCombinedGraph,
    createSendingSignal,
    getCombinedGraphAverage,
    updateSignalTitle,
    deleteSignal,
    addButton,
    updateButton,
    deleteButton,
    getUserProjects,
    getProjectById,
    deleteProjectById,
    updateProject,
    addSensorToProject,
    updateSensorInfo,
    getSensorById,
    getProjectSensors,
    deleteSensorById,
    updateGraphInfo,
    getProjectData,
    updateButtonReleasedData,
    createCombinedSensorGraph
};