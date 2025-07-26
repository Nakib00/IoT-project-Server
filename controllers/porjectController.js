const UserModel = require('../models/userModel');
const {
    formatResponse
} = require('../utils/responseFormatter');
const jwt = require('jsonwebtoken');

// A secret key for signing the JWT. In a real application, you should store this in an environment variable.
const JWT_SECRET = 'your-super-secret-key';

const registerUser = (req, res) => {
    const {
        name,
        email,
        phone,
        password
    } = req.body;
    if (!name || !email || !phone || !password) {
        return res.status(400).json(formatResponse(false, 400, 'All fields are required.'));
    }
    if (UserModel.findUserByEmail(email)) {
        return res.status(400).json(formatResponse(false, 400, 'A user with this email already exists.'));
    }
    const newUser = UserModel.createUser({
        name,
        email,
        phone,
        password
    });

    // Generate a JWT for the new user
    const token = jwt.sign({
        id: newUser.id,
        email: newUser.email
    }, JWT_SECRET, {
        expiresIn: '1h'
    });

    res.status(201).json(formatResponse(true, 201, 'User registered successfully!', {
        userId: newUser.id, 
        token
    }));
};

const loginUser = (req, res) => {
    const {
        email,
        password
    } = req.body;
    const user = UserModel.findUserByEmail(email);
    if (user && user.password === password) {

        // Generate a JWT for the logged-in user
        const token = jwt.sign({
            id: user.id,
            email: user.email
        }, JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json(formatResponse(true, 200, 'Login successful!', {
            userId: user.id,
            name: user.name,
            email: user.email,
            token
        }));
    } else {
        res.status(401).json(formatResponse(false, 401, 'Invalid email or password.'));
    }
};

module.exports = {
    registerUser,
    loginUser,
};
