const UserModel = require('../models/userModel');
const { formatResponse } = require('../utils/responseFormatter');
const createError = require('http-errors');

// Creates a new project for a user.
const createProject = (req, res, next) => {
  try {
    const { userId } = req.params;
    const { projectName, description, developmentBoard } = req.body;
    const newProject = UserModel.createProjectForUser(userId, {
      projectName,
      description,
      developmentBoard,
    });
    if (!newProject) throw createError(404, 'User not found.');
    res.status(201).json(formatResponse(true, 201, 'Project created successfully!', { project: newProject }));
  } catch (err) {
    next(err);
  }
};

// Creates a new sending signal group within a project.
const createSendingSignal = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, buttons } = req.body;

    if (!title || !buttons || !Array.isArray(buttons) || buttons.length === 0) {
      throw createError(400, 'Request body must contain a title and a non-empty array of buttons.');
    }

    const validButtonTypes = ['momentary', 'toggle', 'touch'];
    for (const button of buttons) {
      if (!validButtonTypes.includes(button.type)) {
        throw createError(400, `Invalid button type: ${button.type}. Must be one of 'momentary', 'toggle', or 'touch'.`);
      }
    }

    const newSignal = UserModel.createSendingSignalForProject(projectId, { title, buttons });
    if (!newSignal) throw createError(404, 'Project not found.');

    res.status(201).json(formatResponse(true, 201, 'Sending signal created successfully!', { signal: newSignal }));
  } catch (err) {
    next(err);
  }
};

// Updates the title of a sending signal.
const updateSignalTitle = (req, res, next) => {
  try {
    const { signalId } = req.params;
    const { title } = req.body;
    if (!title) throw createError(400, 'The "title" field is required.');

    const wasUpdated = UserModel.updateSendingSignalTitle(signalId, title);
    if (!wasUpdated) throw createError(404, 'Signal not found.');

    res.status(200).json(formatResponse(true, 200, 'Signal title updated successfully.'));
  } catch (err) {
    next(err);
  }
};

// Deletes an entire sending signal group.
const deleteSignal = (req, res, next) => {
  try {
    const { signalId } = req.params;
    const wasDeleted = UserModel.deleteSendingSignal(signalId);
    if (!wasDeleted) throw createError(404, 'Signal not found.');
    res.status(200).json(formatResponse(true, 200, 'Signal deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

// Adds a new button to an existing signal.
const addButton = (req, res, next) => {
  try {
    const { signalId } = req.params;
    const { title, type, pinnumber, sendingdata, releaseddata } = req.body;

    if (!title || !type || !pinnumber) {
      throw createError(400, 'Fields "title", "type", and "pinnumber" are required.');
    }

    const validButtonTypes = ['momentary', 'toggle', 'touch'];
    if (!validButtonTypes.includes(type)) {
      throw createError(400, `Invalid button type: ${type}. Must be one of 'momentary', 'toggle', or 'touch'.`);
    }

    const newButton = UserModel.addButtonToSignal(signalId, {
      title,
      type,
      pinnumber,
      sendingdata,
      releaseddata,
    });

    if (!newButton) throw createError(404, 'Signal not found.');

    res.status(201).json(formatResponse(true, 201, 'Button added successfully!', { button: newButton }));
  } catch (err) {
    next(err);
  }
};

// Updates an existing button's information.
const updateButton = (req, res, next) => {
  try {
    const { buttonId } = req.params;
    const buttonData = req.body;

    if (Object.keys(buttonData).length === 0) {
      throw createError(400, 'At least one field to update is required.');
    }

    if (buttonData.type) {
      const validButtonTypes = ['momentary', 'toggle', 'touch'];
      if (!validButtonTypes.includes(buttonData.type)) {
        throw createError(400, `Invalid button type: ${buttonData.type}. Must be one of 'momentary', 'toggle', or 'touch'.`);
      }
    }

    const wasUpdated = UserModel.updateButtonById(buttonId, buttonData);
    if (!wasUpdated) throw createError(404, 'Button not found.');

    res.status(200).json(formatResponse(true, 200, 'Button updated successfully.'));
  } catch (err) {
    next(err);
  }
};

// Deletes a button from a signal.
const deleteButton = (req, res, next) => {
  try {
    const { buttonId } = req.params;
    const wasDeleted = UserModel.deleteButtonById(buttonId);
    if (!wasDeleted) throw createError(404, 'Button not found.');
    res.status(200).json(formatResponse(true, 200, 'Button deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

// Fetches all projects for a given user.
const getUserProjects = (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = UserModel.findUserById(userId);

    if (!user) throw createError(404, 'User not found.');

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

    res.json(formatResponse(true, 200, 'Projects fetched successfully', { projects: formattedProjects }));
  } catch (err) {
    next(err);
  }
};

// Fetches a single project by its ID.
const getProjectById = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = UserModel.findProjectById(projectId);
    if (!project) throw createError(404, 'Project not found.');
    res.json(formatResponse(true, 200, 'Project fetched successfully', { project }));
  } catch (err) {
    next(err);
  }
};

// Updates a project's details.
const updateProject = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { projectName, description, developmentBoard } = req.body;

    const projectData = {};
    if (projectName) projectData.projectName = projectName;
    if (description) projectData.description = description;
    if (developmentBoard) projectData.developmentBoard = developmentBoard;

    if (Object.keys(projectData).length === 0) {
      throw createError(400, 'No fields to update provided.');
    }

    const updatedProject = UserModel.updateProjectById(projectId, projectData);
    if (!updatedProject) throw createError(404, 'Project not found.');

    res.status(200).json(formatResponse(true, 200, 'Project updated successfully!', { project: updatedProject }));
  } catch (err) {
    next(err);
  }
};

// Deletes a project by its ID.
const deleteProjectById = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const wasDeleted = UserModel.deleteProjectById(projectId);
    if (!wasDeleted) throw createError(404, 'Project not found.');
    res.status(200).json(formatResponse(true, 200, 'Project deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

// Adds a new sensor to a project.
const addSensorToProject = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { sensorName } = req.body;
    if (!sensorName) throw createError(400, 'The "sensorName" field is required.');

    const newSensor = UserModel.addSensor(projectId, sensorName);
    if (!newSensor) throw createError(404, 'Project not found.');

    res.status(201).json(formatResponse(true, 201, 'Sensor added successfully!', { sensor: newSensor }));
  } catch (err) {
    next(err);
  }
};

// Updates a sensor's information.
const updateSensorInfo = (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { title, typeOfPin, pinNumber } = req.body;

    const sensorData = {};
    if (title) sensorData.title = title;
    if (typeOfPin) sensorData.typeOfPin = typeOfPin;
    if (pinNumber) sensorData.pinNumber = pinNumber;

    if (Object.keys(sensorData).length === 0) {
      throw createError(400, 'At least one field (title, typeOfPin, pinNumber) is required.');
    }
    if (typeOfPin && !['Analog', 'Digital'].includes(typeOfPin)) {
      throw createError(400, 'typeOfPin must be either "Analog" or "Digital".');
    }

    const updatedSensor = UserModel.updateSensorById(sensorId, sensorData);
    if (!updatedSensor) throw createError(404, 'Sensor not found.');

    res.status(200).json(formatResponse(true, 200, 'Sensor updated successfully!', { sensor: updatedSensor }));
  } catch (err) {
    next(err);
  }
};

// Fetches a single sensor by its ID.
const getSensorById = (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const sensor = UserModel.findSensorById(sensorId);

    if (!sensor) throw createError(404, 'Sensor not found.');
    if (sensor.data && Array.isArray(sensor.data)) {
      sensor.data.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
    }

    res.json(formatResponse(true, 200, 'Sensor data fetched successfully', { sensor }));
  } catch (err) {
    next(err);
  }
};

// Fetches all sensors for a given project.
const getProjectSensors = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const project = UserModel.findProjectById(projectId);

    if (!project) throw createError(404, 'Project not found.');

    const sensors = (project.sensordata || []).map(sensor => ({
      id: sensor.id,
      title: sensor.title,
    }));
    res.json(formatResponse(true, 200, 'Sensors fetched successfully', { sensors }));
  } catch (err) {
    next(err);
  }
};

// Deletes a sensor by its ID.
const deleteSensorById = (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const wasDeleted = UserModel.deleteSensorById(sensorId);
    if (!wasDeleted) throw createError(404, 'Sensor not found.');
    res.status(200).json(formatResponse(true, 200, 'Sensor deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

// Updates the graph information for a sensor.
const updateGraphInfo = (req, res, next) => {
  try {
    const { sensorId } = req.params;
    const { title, type, maxDataPoints, xAxisLabel, yAxisLabel } = req.body;

    const graphData = {};
    if (title) graphData.title = title;
    if (type) graphData.type = type;
    if (maxDataPoints) graphData.maxDataPoints = Number(maxDataPoints);
    if (xAxisLabel) graphData.xAxisLabel = xAxisLabel;
    if (yAxisLabel) graphData.yAxisLabel = yAxisLabel;

    if (Object.keys(graphData).length === 0) {
      throw createError(400, 'At least one graph info field is required.');
    }

    if (type) {
      const validTypes = ['line','bar','stackedBar','horizontalBar','area','stackedArea','scatter','bubble','pie','doughnut','composed','radar','polarArea','histogram','boxPlot','heatmap','violin','treemap','waterfall','funnel','gauge','candlestick','ohlc','sankey','choropleth','geoScatter'];
      if (!validTypes.includes(type)) {
        throw createError(400, `Invalid graph type. Must be one of: ${validTypes.join(', ')}.`);
      }
    }

    const updatedSensor = UserModel.updateGraphInfoById(sensorId, graphData);
    if (!updatedSensor) throw createError(404, 'Sensor not found.');

    res.status(200).json(formatResponse(true, 200, 'Graph info updated successfully!', { graphInfo: updatedSensor.graphInfo }));
  } catch (err) {
    next(err);
  }
};

// Fetches data for a project using its token.
const getProjectData = (req, res, next) => {
  try {
    const { token } = req.params;
    const project = UserModel.findProjectByToken(token);
    if (!project) throw createError(404, 'Invalid project token.');
    res.json(formatResponse(true, 200, 'Data fetched successfully', { sensordata: project.sensordata || [] }));
  } catch (err) {
    next(err);
  }
};

// Updates the releaseddata of a button by its ID.
const updateButtonReleasedData = (req, res, next) => {
  try {
    const { buttonId } = req.params;
    const { releaseddata } = req.body;
    if (typeof releaseddata === 'undefined') {
      throw createError(400, 'The "releaseddata" field is required.');
    }

    const result = UserModel.updateButtonAndValidateReleasedData(buttonId, releaseddata);

    if (result.success) {
      // push over WebSocket
      const wss = req.app.get('wss');
      const project = UserModel.findProjectByButtonId(buttonId);
      if (project && wss) {
        wss.clients.forEach((client) => {
          if (client.readyState === 1 && client.isAuthenticated && client.token === project.token) {
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
      res.status(200).json(formatResponse(true, 200, 'Button releaseddata updated successfully.'));
    } else {
      throw createError(400, result.message || 'Validation failed.');
    }
  } catch (err) {
    next(err);
  }
};

// Creates a new combined sensor graph for a project.
const createCombinedSensorGraph = (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, sensorIds } = req.body;

    if (!title || !sensorIds || !Array.isArray(sensorIds) || sensorIds.length === 0) {
      throw createError(400, 'Request must include a "title" and a non-empty array of "sensorIds".');
    }

    const result = UserModel.createCombinedSensorGraphForProject(projectId, title, sensorIds);
    if (!result.success) {
      throw createError(result.status || 400, result.message);
    }

    res.status(201).json(formatResponse(true, 201, 'Combined sensor graph created successfully!', { combinedGraph: result.data }));
  } catch (err) {
    next(err);
  }
};

// Calculates and returns the average data for a combined sensor graph.
const getCombinedGraphAverage = (req, res, next) => {
  try {
    const { graphId } = req.params;
    const { dataType, value } = req.body;

    if (!dataType) throw createError(400, 'The "dataType" field is required.');
    const validDataTypes = ['count', 'days', 'today', 'realtime'];
    if (!validDataTypes.includes(dataType)) {
      throw createError(400, `Invalid dataType. Must be one of: ${validDataTypes.join(', ')}.`);
    }
    if ((dataType === 'count' || dataType === 'days') && (typeof value !== 'number' || value <= 0)) {
      throw createError(400, `The "value" field must be a positive number for dataType '${dataType}'.`);
    }

    const result = UserModel.calculateCombinedGraphAverage(graphId, { dataType, value });
    if (!result.success) {
      throw createError(result.status || 404, result.message);
    }

    res.status(200).json(formatResponse(true, 200, 'Average data calculated successfully!', result.data));
  } catch (err) {
    next(err);
  }
};

// Fetches and calculates data for a combined graph based on its settings.
const getCombinedGraphData = (req, res, next) => {
  try {
    const { graphId } = req.params;
    const { startDate, endDate } = req.query;

    const result = UserModel.getCombinedGraphDataById(graphId, { startDate, endDate });
    if (!result.success) {
      throw createError(result.status || 404, result.message);
    }
    res.status(200).json(formatResponse(true, 200, 'Combined graph data fetched successfully!', result.data));
  } catch (err) {
    next(err);
  }
};

// Updates a combined graph's title and/or sensor list.
const updateCombinedGraph = (req, res, next) => {
  try {
    const { graphId } = req.params;
    const { title, sensorIds } = req.body;

    if (!title && !sensorIds) {
      throw createError(400, 'Request body must contain either "title" or "sensorIds".');
    }

    const result = UserModel.updateCombinedGraphById(graphId, { title, sensorIds });
    if (!result.success) {
      throw createError(result.status || 404, result.message);
    }

    res.status(200).json(formatResponse(true, 200, 'Combined graph updated successfully!', { updatedGraph: result.data }));
  } catch (err) {
    next(err);
  }
};

// Deletes a combined graph by its ID.
const deleteCombinedGraph = (req, res, next) => {
  try {
    const { graphId } = req.params;
    const wasDeleted = UserModel.deleteCombinedGraphById(graphId);
    if (!wasDeleted) throw createError(404, 'Combined graph not found.');
    res.status(200).json(formatResponse(true, 200, 'Combined graph deleted successfully.'));
  } catch (err) {
    next(err);
  }
};

// Updates the configuration of a combined graph.
const updateCombinedGraphInfo = (req, res, next) => {
  try {
    const { graphId } = req.params;
    const graphInfoData = req.body;

    if (Object.keys(graphInfoData).length === 0) {
      throw createError(400, 'Request body must contain at least one field to update.');
    }

    if (graphInfoData.type) {
      const validTypes = ['line','bar','stackedBar','horizontalBar','area','stackedArea','scatter','bubble','pie','doughnut','composed','radar','polarArea','histogram','boxPlot','heatmap','violin','treemap','waterfall','funnel','gauge','candlestick','ohlc','sankey','choropleth','geoScatter'];
      if (!validTypes.includes(graphInfoData.type)) {
        throw createError(400, `Invalid graph type. Must be one of: ${validTypes.join(', ')}.`);
      }
    }
    if (graphInfoData.maxDataPoints && (typeof graphInfoData.maxDataPoints !== 'number' || graphInfoData.maxDataPoints <= 0)) {
      throw createError(400, 'maxDataPoints must be a positive number.');
    }

    const result = UserModel.updateCombinedGraphInfoById(graphId, graphInfoData);
    if (!result.success) {
      throw createError(result.status || 404, result.message);
    }

    res.status(200).json(formatResponse(true, 200, 'Combined graph info updated successfully!', { updatedGraphInfo: result.data }));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createProject,
  updateCombinedGraphInfo,
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
