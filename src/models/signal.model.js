const { v4: uuidv4 } = require('uuid');
const store = require('./store');

const createSendingSignalForProject = (projectId, signalData) => {
  const users = store.read();
  const user = users.find((u) => u.projects?.some((p) => p.projectId === projectId));
  if (!user) return null;
  const project = user.projects.find((p) => p.projectId === projectId);

  const newSignal = {
    id: uuidv4(),
    title: signalData.title,
    button: (signalData.buttons || []).map((btn) => ({
      id: uuidv4(),
      title: btn.title,
      type: btn.type,
      pinnumber: btn.pinnumber,
      sendingdata: btn.sendingdata || [],
      releaseddata: btn.releaseddata || '0',
      char: btn.char,
      action: btn.action,
      ondata: btn.ondata,
      offdata: btn.offdata,
      sensitivity: btn.sensitivity,
      defaultState: btn.defaultState,
    })),
  };

  project.sendingsignal ||= [];
  project.sendingsignal.push({ signal: [newSignal] });
  project.updatedAt = new Date().toISOString();

  store.write(users);
  return newSignal;
};

const updateSendingSignalTitle = (signalId, newTitle) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        const s = group.signal?.find((x) => x.id === signalId);
        if (s) {
          s.title = newTitle;
          p.updatedAt = new Date().toISOString();
          store.write(users);
          return true;
        }
      }
    }
  }
  return false;
};

const deleteSendingSignal = (signalId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        const idx = group.signal?.findIndex((x) => x.id === signalId);
        if (idx > -1) {
          group.signal.splice(idx, 1);
          p.updatedAt = new Date().toISOString();
          store.write(users);
          return true;
        }
      }
    }
  }
  return false;
};

const addButtonToSignal = (signalId, buttonData) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        const s = group.signal?.find((x) => x.id === signalId);
        if (s) {
          const newButton = { id: uuidv4(), ...buttonData };
          s.button ||= [];
          s.button.push(newButton);
          p.updatedAt = new Date().toISOString();
          store.write(users);
          return newButton;
        }
      }
    }
  }
  return null;
};

const updateButtonById = (buttonId, buttonData) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        for (const s of group.signal || []) {
          const b = s.button?.find((x) => x.id === buttonId);
          if (b) {
            Object.assign(b, buttonData);
            p.updatedAt = new Date().toISOString();
            store.write(users);
            return true;
          }
        }
      }
    }
  }
  return false;
};

const deleteButtonById = (buttonId) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        for (const s of group.signal || []) {
          const idx = s.button?.findIndex((x) => x.id === buttonId);
          if (idx > -1) {
            s.button.splice(idx, 1);
            p.updatedAt = new Date().toISOString();
            store.write(users);
            return true;
          }
        }
      }
    }
  }
  return false;
};

const updateButtonAndValidateReleasedData = (buttonId, newReleasedData) => {
  const users = store.read();
  for (const u of users) {
    for (const p of u.projects || []) {
      for (const group of p.sendingsignal || []) {
        for (const s of group.signal || []) {
          const b = s.button?.find((x) => x.id === buttonId);
          if (b) {
            if (!b.sendingdata || !b.sendingdata.includes(newReleasedData)) {
              return { success: false, message: `Invalid input. The value for releaseddata must be one of: [${(b.sendingdata || []).join(', ')}]` };
            }
            b.releaseddata = newReleasedData;
            p.updatedAt = new Date().toISOString();
            store.write(users);
            return { success: true };
          }
        }
      }
    }
  }
  return { success: false, message: 'Button not found.' };
};

module.exports = {
  createSendingSignalForProject,
  updateSendingSignalTitle,
  deleteSendingSignal,
  addButtonToSignal,
  updateButtonById,
  deleteButtonById,
  updateButtonAndValidateReleasedData,
};
