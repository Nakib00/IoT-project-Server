const { v4: uuidv4 } = require('uuid');
const store = require('./store');

const findUserByEmail = (email) => {
  const users = store.read();
  return users.find((u) => u.email === email);
};

const findUserById = (userId) => {
  const users = store.read();
  return users.find((u) => u.id === userId);
};

const createUser = (userData) => {
  const users = store.read();
  const newUser = { id: uuidv4(), ...userData, projects: [] };
  users.push(newUser);
  store.write(users);
  return newUser;
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
};
