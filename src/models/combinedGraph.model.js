const { v4: uuidv4 } = require('uuid');
const store = require('./store');

const createCombinedSensorGraphForProject = (projectId, title, sensorIds) => {
  const users = store.read();
  let project = null;

  for (const u of users) {
    const p = u.projects?.find((x) => x.projectId === projectId);
    if (p) {
      project = p;
      break;
    }
  }
  if (!project) return { success: false, status: 404, message: 'Project not found.' };

  const included = [];
  for (const sid of sensorIds) {
    const s = project.sensordata?.find((x) => x.id === sid);
    if (!s) return { success: false, status: 400, message: `Sensor with ID "${sid}" not found in this project.` };
    included.push({ sensorid: s.id, sensorTitle: s.title });
  }

  const graph = {
    id: uuidv4(),
    title,
    sensors: included,
    convinegraphInfo: {
      title: `Combined: ${title}`,
      type: 'line',
      maxDataPoints: 20,
      xAxisLabel: 'Time',
      yAxisLabel: 'Values',
    },
  };

  project.convinesensorgraph ||= [];
  project.convinesensorgraph.push(graph);
  project.updatedAt = new Date().toISOString();
  store.write(users);

  return { success: true, data: graph };
};

const findProjectByCombinedGraphId = (graphId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      const g = p.convinesensorgraph?.find((x) => x.id === graphId);
      if (g) return { user: u, project: p, combinedGraph: g };
    }
  }
  return { user: null, project: null, combinedGraph: null };
};

const calculateCombinedGraphAverage = (graphId, { dataType, value }) => {
  const { project, combinedGraph } = findProjectByCombinedGraphId(graphId);
  if (!project || !combinedGraph) return { success: false, status: 404, message: 'Combined graph not found.' };

  const results = [];
  const sensorIds = combinedGraph.sensors.map((s) => s.sensorid);

  for (const sid of sensorIds) {
    const sensor = project.sensordata?.find((x) => x.id === sid);
    if (!sensor || !sensor.data || sensor.data.length === 0) {
      results.push({ sensorId: sid, title: sensor ? sensor.title : 'Unknown Sensor', average: 0, note: 'Sensor not found or has no data.' });
      continue;
    }

    let dataToAvg = [];
    const now = new Date();

    switch (dataType) {
      case 'realtime':
        dataToAvg = sensor.data.slice(-1);
        break;
      case 'count':
        dataToAvg = sensor.data.slice(-value);
        break;
      case 'today': {
        const start = new Date(now.setHours(0, 0, 0, 0));
        dataToAvg = sensor.data.filter((d) => new Date(d.datetime) >= start);
        break;
      }
      case 'days': {
        const start = new Date(now);
        start.setDate(now.getDate() - value);
        dataToAvg = sensor.data.filter((d) => new Date(d.datetime) >= start);
        break;
      }
      default:
        dataToAvg = [];
    }

    const avg = dataToAvg.length ? dataToAvg.reduce((a, c) => a + c.value, 0) / dataToAvg.length : 0;
    results.push({ sensorId: sensor.id, title: sensor.title, average: Number(avg.toFixed(2)) });
  }

  combinedGraph.convinegraphInfo ||= {};
  combinedGraph.convinegraphInfo.lastFilter = {
    dataType,
    value: value || null,
    queriedAt: new Date().toISOString(),
  };

  // best-effort writeback
  const users = store.read();
  outer: for (const u of users) {
    const pIdx = u.projects?.findIndex((p) => p.projectId === project.projectId);
    if (pIdx > -1) {
      const gIdx = u.projects[pIdx].convinesensorgraph.findIndex((g) => g.id === graphId);
      if (gIdx > -1) {
        u.projects[pIdx].convinesensorgraph[gIdx] = combinedGraph;
        store.write(users);
        break outer;
      }
    }
  }

  return { success: true, data: { graphTitle: combinedGraph.title, averages: results } };
};

const getCombinedGraphDataById = (graphId, { startDate, endDate } = {}) => {
  const { project, combinedGraph } = findProjectByCombinedGraphId(graphId);
  if (!project || !combinedGraph) return { success: false, status: 404, message: 'Combined graph not found.' };

  const maxDataPoints = combinedGraph.convinegraphInfo?.maxDataPoints || 10;
  const out = [];
  const ids = combinedGraph.sensors.map((s) => s.sensorid);

  for (const sid of ids) {
    const sensor = project.sensordata?.find((x) => x.id === sid);
    if (!sensor || !sensor.data || sensor.data.length === 0) {
      out.push({ sensorId: sid, title: sensor ? sensor.title : 'Unknown Sensor', average: 0, dataPointCount: 0, note: 'Sensor not found or has no data.' });
      continue;
    }

    let filtered = sensor.data;
    if (startDate) filtered = filtered.filter((d) => new Date(d.datetime) >= new Date(startDate));
    if (endDate)   filtered = filtered.filter((d) => new Date(d.datetime) <= new Date(endDate));

    const last = filtered.slice(-maxDataPoints);
    const avg = last.length ? last.reduce((a, c) => a + c.value, 0) / last.length : 0;

    out.push({ sensorId: sensor.id, title: sensor.title, average: Number(avg.toFixed(2)), dataPointCount: last.length });
  }

  return { success: true, data: { graphTitle: combinedGraph.title, convinegraphInfo: combinedGraph.convinegraphInfo, results: out } };
};

const updateCombinedGraphById = (graphId, { title, sensorIds }) => {
  const users = store.read();
  let updated = null;
  for (const u of users) {
    for (const p of u.projects || []) {
      const idx = p.convinesensorgraph?.findIndex((g) => g.id === graphId);
      if (idx > -1) {
        const g = p.convinesensorgraph[idx];
        if (title) {
          g.title = title;
          g.convinegraphInfo ||= {};
          g.convinegraphInfo.title = `Combined: ${title}`;
        }
        if (sensorIds && Array.isArray(sensorIds)) {
          const list = [];
          for (const sid of sensorIds) {
            const exists = p.sensordata?.find((s) => s.id === sid);
            if (!exists) return { success: false, status: 400, message: `Sensor with ID "${sid}" does not exist in this project.` };
            list.push({ sensorid: exists.id, sensorTitle: exists.title });
          }
          g.sensors = list;
        }
        p.updatedAt = new Date().toISOString();
        updated = g;
        break;
      }
    }
    if (updated) break;
  }

  if (!updated) return { success: false, status: 404, message: 'Combined graph not found.' };
  store.write(users);
  return { success: true, data: updated };
};

const deleteCombinedGraphById = (graphId) => {
  const users = store.read();
  let deleted = false;
  for (const u of users) {
    for (const p of u.projects || []) {
      const idx = p.convinesensorgraph?.findIndex((g) => g.id === graphId);
      if (idx > -1) {
        p.convinesensorgraph.splice(idx, 1);
        p.updatedAt = new Date().toISOString();
        deleted = true;
        break;
      }
    }
    if (deleted) break;
  }
  if (deleted) store.write(users);
  return deleted;
};

const updateCombinedGraphInfoById = (graphId, newInfo) => {
  const users = store.read();
  let updated = null;
  for (const u of users) {
    for (const p of u.projects || []) {
      const g = p.convinesensorgraph?.find((x) => x.id === graphId);
      if (g) {
        g.convinegraphInfo ||= {};
        Object.assign(g.convinegraphInfo, newInfo);
        p.updatedAt = new Date().toISOString();
        updated = g.convinegraphInfo;
        break;
      }
    }
    if (updated) break;
  }
  if (!updated) return { success: false, status: 404, message: 'Combined graph not found.' };
  store.write(users);
  return { success: true, data: updated };
};

module.exports = {
  createCombinedSensorGraphForProject,
  findProjectByCombinedGraphId,
  calculateCombinedGraphAverage,
  getCombinedGraphDataById,
  updateCombinedGraphById,
  deleteCombinedGraphById,
  updateCombinedGraphInfoById,
};
