const UserModel = require('../models/userModel');
const {
    formatResponse
} = require('../utils/responseFormatter');

const createProject = (req, res) => {
    const {
        email,
        projectName,
        description,
        developmentBoard,
        sensorCount
    } = req.body;
    const newProject = UserModel.createProjectForUser(email, {
        projectName,
        description,
        developmentBoard,
        sensorCount: Number(sensorCount)
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
        email
    } = req.params;
    const user = UserModel.findUserByEmail(email);
    if (user) {
        res.json(formatResponse(true, 200, 'Projects fetched successfully', {
            projects: user.projects || []
        }));
    } else {
        res.status(404).json(formatResponse(false, 404, 'User not found.'));
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

const updateSensorInfo = (req, res) => {
    const {
        token,
        sensorId,
        title,
        typeOfPin,
        pinNumber
    } = req.body;
    const updated = UserModel.updateSensorInfoForProject(token, sensorId, {
        title,
        typeOfPin,
        pinNumber
    });
    if (updated) {
        res.json(formatResponse(true, 200, 'Sensor updated successfully!'));
    } else {
        res.status(404).json(formatResponse(false, 404, 'Project or Sensor not found.'));
    }
};

module.exports = {
    createProject,
    getUserProjects,
    getProjectData,
    updateSensorInfo
};