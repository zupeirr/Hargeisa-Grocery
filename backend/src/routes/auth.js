const { Router } = require('express');
const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    // Development fallback for existing plain text passwords
    const isPlainTextMatch = !user.password.startsWith('$2') && user.password === password;

    if (!isMatch && !isPlainTextMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: safeUser, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : undefined;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let id;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    } catch (err) {
      // Handle legacy mock token
      if (token.startsWith('mock-jwt-')) {
        id = token.replace('mock-jwt-', '');
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error('Auth check error:', err);
    res.status(500).json({ error: 'Auth check failed' });
  }
});

router.post('/change-password', async (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : undefined;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  try {
    let id;
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      id = decoded.id;
    } catch (err) {
      if (token.startsWith('mock-jwt-')) {
        id = token.replace('mock-jwt-', '');
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    const isPlainTextMatch = !user.password.startsWith('$2') && user.password === currentPassword;

    if (!isMatch && !isPlainTextMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
