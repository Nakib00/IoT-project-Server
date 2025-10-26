const fs = require('fs');
const path = require('path');

const USERS_DB_PATH = path.join(__dirname, '..', 'users.json');

function ensureFile() {
  try {
    if (!fs.existsSync(USERS_DB_PATH)) {
      fs.writeFileSync(USERS_DB_PATH, '[]');
    }
  } catch {}
}

ensureFile();

const read = () => {
  try {
    const data = fs.readFileSync(USERS_DB_PATH, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    console.error('Error reading users DB:', e);
    return [];
  }
};

const write = (data) => {
  try {
    fs.writeFileSync(USERS_DB_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Error writing users DB:', e);
  }
};

module.exports = { read, write, USERS_DB_PATH };
