const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// Register function
// This function allows users to register by providing a username, email, password, and phone number
exports.register = async (req, res) => {
  try {
    const { username, email, password, phone } = req.body;

    const input = email.trim().toLowerCase();

    const userExists = await User.findOne({ $or: [{ username }, { email: input }] });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      email,
      phone,
      password: hashedPassword
    });

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Login function
// This function allows users to log in using either their username or email and password.
exports.login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

   const input = usernameOrEmail.trim().toLowerCase();

  const user = await User.findOne({
  $or: [
    { username: usernameOrEmail.trim() }, // username is case-sensitive
    { email: input } // email is now stored and queried in lowercase
  ]
});

    console.log(usernameOrEmail);

    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
    );

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};
