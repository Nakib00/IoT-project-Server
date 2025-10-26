const UserModel = require('../models/userModel');
const { formatResponse } = require('../utils/responseFormatter');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const createError = require('http-errors');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const registerUser = (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body || {};
    if (!name || !email || !phone || !password) {
      throw createError(400, 'All fields are required.');
    }
    if (UserModel.findUserByEmail(email)) {
      throw createError(409, 'A user with this email already exists.');
    }
    const hashed = bcrypt.hashSync(password, 10);
    const newUser = UserModel.createUser({ name, email, phone, password: hashed });
    const token = signToken(newUser);

    res.status(201).json(
      formatResponse(true, 201, 'User registered successfully!', {
        userId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        token,
      })
    );
  } catch (err) {
    next(err);
  }
};

const loginUser = (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw createError(400, 'Email and password are required.');
    const user = UserModel.findUserByEmail(email);
    if (!user) throw createError(401, 'Invalid email or password.');
    const ok = bcrypt.compareSync(password, user.password);
    if (!ok) throw createError(401, 'Invalid email or password.');

    const token = signToken(user);
    res.json(
      formatResponse(true, 200, 'Login successful!', {
        userId: user.id,
        name: user.name,
        email: user.email,
        token,
      })
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { registerUser, loginUser };
