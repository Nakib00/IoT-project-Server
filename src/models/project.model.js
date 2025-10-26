const { v4: uuidv4 } = require('uuid');
const store = require('./store');

const createProjectForUser = (userId, projectData) => {
  const users = store.read();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return null;

  const project = {
    projectId: uuidv4(),
    ...projectData,
    token: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sensordata: [],
    sendingsignal: [],
    convinesensorgraph: [],
  };

  users[idx].projects ||= [];
  users[idx].projects.push(project);
  store.write(users);
  return project;
};

const findProjectById = (projectId) => {
  const users = store.read();
  for (const u of users) {
    const p = u.projects?.find((x) => x.projectId === projectId);
    if (p) return p;
  }
  return null;
};

const findProjectByToken = (token) => {
  const users = store.read();
  for (const u of users) {
    const p = u.projects?.find((x) => x.token === token);
    if (p) return p;
  }
  return null;
};

const updateProjectById = (projectId, data) => {
  const users = store.read();
  for (const u of users) {
    const p = u.projects?.find((x) => x.projectId === projectId);
    if (p) {
      Object.assign(p, data);
      p.updatedAt = new Date().toISOString();
      store.write(users);
      return p;
    }
  }
  return null;
};

const deleteProjectById = (projectId) => {
  const users = store.read();
  for (const u of users) {
    const idx = u.projects?.findIndex((x) => x.projectId === projectId);
    if (idx > -1) {
      u.projects.splice(idx, 1);
      store.write(users);
      return true;
    }
  }
  return false;
};

// helper used by signal model
const findProjectByButtonId = (buttonId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      if (p.sendingsignal) {
        for (const group of p.sendingsignal) {
          for (const s of group.signal || []) {
            const btn = s.button?.find((b) => b.id === buttonId);
            if (btn) return p;
          }
        }
      }
    }
  }
  return null;
};

module.exports = {
  createProjectForUser,
  findProjectById,
  findProjectByToken,
  updateProjectById,
  deleteProjectById,
  findProjectByButtonId,
};
