const UserModel = require('../models/userModel');
const {
    formatResponse
} = require('../utils/responseFormatter');

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

const getUserProjects = (req, res) => {
    const {
        userId
    } = req.params;
    const user = UserModel.findUserById(userId);

    if (user) {
        const sortedProjects = (user.projects || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Format the project data to include total sensor count
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

    // Validate input
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

    // --- Validation for graph type ---
    if (type) {
        const validTypes = ['line', 'bar', 'scatter'];
        if (!validTypes.includes(type)) {
            return res.status(400).json(formatResponse(false, 400, `Invalid graph type. Must be one of: ${validTypes.join(', ')}.`));
        }
    }
    // ------------------------------------

    const updatedSensor = UserModel.updateGraphInfoById(sensorId, graphData);

    if (updatedSensor) {
        res.status(200).json(formatResponse(true, 200, 'Graph info updated successfully!', {
            graphInfo: updatedSensor.graphInfo
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Sensor not found.'));
    }
};


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


module.exports = {
    createProject,
    getUserProjects,
    getProjectById,
    deleteProjectById,
    updateProject,
    addSensorToProject,
    updateSensorInfo,
    deleteSensorById,
    updateGraphInfo,
    getUserProjects,
    getProjectData,
};