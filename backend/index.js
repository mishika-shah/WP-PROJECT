// Delete account endpoint
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
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wp');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);
// Signup endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password required.' });
  }
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = new User({ username, password: hashedPassword });
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
app.listen(3000, () => {
  console.log('Backend running on port 3000');
});