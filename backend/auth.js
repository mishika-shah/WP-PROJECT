// Delete account endpoint

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';


const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/wp');


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
// TestDrive schema
const testDriveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  car: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TestDrive = mongoose.model('TestDrive', testDriveSchema);
// Signup endpoint
app.post('/signup', async (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const userExists = await User.findOne({ $or: [{ username }, { email }] });
    if (userExists) {
      return res.status(409).json({ message: 'User with this username or email already exists.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ name, email, username, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
// Login endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Generate JWT token
    const token = jwt.sign({ username }, 'your_jwt_secret', { expiresIn: '1h' });
    res.json({ message: 'Login successful.', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Test drive booking endpoint
app.post('/testdrive', async (req, res) => {
  const { name, email, phone, date, time, car } = req.body;
  if (!name || !email || !phone || !date || !time || !car) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const newTestDrive = new TestDrive({ name, email, phone, date, time, car });
    await newTestDrive.save();
    res.status(201).json({ message: 'Test drive request submitted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get current user details endpoint
app.get('/me', async (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ name: user.name, email: user.email, username: user.username });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token.' });
  }
});
app.delete('/delete-account', async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ message: 'Username required.' });
  }
  try {
    const result = await User.deleteOne({ username });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});
app.listen(3000, () => {
  console.log('Backend running on port 3000');
});