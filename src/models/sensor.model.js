const { v4: uuidv4 } = require('uuid');
const store = require('./store');

const addSensor = (projectId, sensorName) => {
  const users = store.read();
  for (const u of users) {
    const p = u.projects?.find((x) => x.projectId === projectId);
    if (p) {
      const sensor = {
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
      p.sensordata ||= [];
      p.sensordata.push(sensor);
      p.updatedAt = new Date().toISOString();
      store.write(users);
      return sensor;
    }
  }
  return null;
};

const updateSensorById = (sensorId, sensorData) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      const s = p.sensordata?.find((x) => x.id === sensorId);
      if (s) {
        Object.assign(s, sensorData);
        const now = new Date().toISOString();
        s.updatedAt = now;
        p.updatedAt = now;
        store.write(users);
        return s;
      }
    }
  }
  return null;
};

const findSensorById = (sensorId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      const s = p.sensordata?.find((x) => x.id === sensorId);
      if (s) return s;
    }
  }
  return null;
};

const deleteSensorById = (sensorId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      const idx = p.sensordata?.findIndex((x) => x.id === sensorId);
      if (idx > -1) {
        p.sensordata.splice(idx, 1);
        p.updatedAt = new Date().toISOString();
        store.write(users);
        return true;
      }
    }
  }
  return false;
};

const updateGraphInfoById = (sensorId, graphData) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      const s = p.sensordata?.find((x) => x.id === sensorId);
      if (s) {
        s.graphInfo ||= {};
        Object.assign(s.graphInfo, graphData);
        const now = new Date().toISOString();
        s.updatedAt = now;
        p.updatedAt = now;
        store.write(users);
        return s;
      }
    }
  }
  return null;
};

const addDataToSensor = (token, payload) => {
  const users = store.read();
  for (const u of users) {
    const p = u.projects?.find((x) => x.token === token);
    if (p) {
      p.updatedAt = new Date().toISOString();
      for (const pin in payload) {
        const s = p.sensordata?.find((x) => x.pinNumber === pin);
        if (s) {
          s.data.push({ datetime: new Date().toISOString(), value: payload[pin] });
          if (s.data.length > 100) s.data.shift();
        }
      }
      store.write(users);
      return true;
    }
  }
  return false;
};

module.exports = {
  addSensor,
  updateSensorById,
  findSensorById,
  deleteSensorById,
  updateGraphInfoById,
  addDataToSensor,
};
