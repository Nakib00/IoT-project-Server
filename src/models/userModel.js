// Aggregates domain models and re-exports with the SAME function names
// so controllers need ZERO changes.

const User = require('./user.model');
const Project = require('./project.model');
const Sensor = require('./sensor.model');
const Signal = require('./signal.model');
const Combined = require('./combinedGraph.model');
const store = require('./store');

module.exports = {
  // low-level (was exported before)
  readUsersDB: store.read,

  // user
  findUserByEmail: User.findUserByEmail,
  findUserById: User.findUserById,
  createUser: User.createUser,

  // project
  createProjectForUser: Project.createProjectForUser,
  findProjectById: Project.findProjectById,
  findProjectByToken: Project.findProjectByToken,
  updateProjectById: Project.updateProjectById,
  deleteProjectById: Project.deleteProjectById,
  findProjectByButtonId: Project.findProjectByButtonId,

  // sensor
  addSensor: Sensor.addSensor,
  updateSensorById: Sensor.updateSensorById,
  findSensorById: Sensor.findSensorById,
  deleteSensorById: Sensor.deleteSensorById,
  updateGraphInfoById: Sensor.updateGraphInfoById,
  addDataToSensor: Sensor.addDataToSensor,

  // signal/buttons
  createSendingSignalForProject: Signal.createSendingSignalForProject,
  updateSendingSignalTitle: Signal.updateSendingSignalTitle,
  deleteSendingSignal: Signal.deleteSendingSignal,
  addButtonToSignal: Signal.addButtonToSignal,
  updateButtonById: Signal.updateButtonById,
  deleteButtonById: Signal.deleteButtonById,
  updateButtonAndValidateReleasedData: Signal.updateButtonAndValidateReleasedData,

  // combined graphs
  createCombinedSensorGraphForProject: Combined.createCombinedSensorGraphForProject,
  findProjectByCombinedGraphId: Combined.findProjectByCombinedGraphId,
  calculateCombinedGraphAverage: Combined.calculateCombinedGraphAverage,
  getCombinedGraphDataById: Combined.getCombinedGraphDataById,
  updateCombinedGraphById: Combined.updateCombinedGraphById,
  deleteCombinedGraphById: Combined.deleteCombinedGraphById,
  updateCombinedGraphInfoById: Combined.updateCombinedGraphInfoById,
};
