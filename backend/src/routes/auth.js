const { Router } = require('express');
const prisma = require('../lib/prisma');

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser, token: `mock-jwt-${user.id}` });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : undefined;
  if (!token || !token.startsWith('mock-jwt-')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const id = token.replace('mock-jwt-', '');
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: 'Auth check failed' });
  }
});

router.post('/change-password', async (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : undefined;
  if (!token || !token.startsWith('mock-jwt-')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const id = token.replace('mock-jwt-', '');
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.password !== currentPassword) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }
    await prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
