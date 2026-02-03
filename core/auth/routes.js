const express = require('express');
const router = express.Router();
const UserService = require('./services/userService');
const { authenticate, requireAdmin } = require('./middleware/authenticate');

const userService = new UserService();

/**
 * POST /api/auth/create-user
 * Create a new user (Admin only)
 */
router.post('/create-user', authenticate, requireAdmin, async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/auth/send-invite
 * Send invite to a user
 * TEMPORARY: Public for first user setup - make admin-only later!
 */
router.post('/send-invite', async (req, res) => {
    try {
        const { userId } = req.body;
        const result = await userService.sendInvite(userId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/auth/set-password
 * Set password using invite token (Public)
 */
router.post('/set-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const result = await userService.setPassword(token, newPassword);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Login (Public)
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await userService.login(username, password);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

/**
 * GET /api/auth/me
 * Get current user (Protected)
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * POST /api/auth/logout
 * Logout (Protected)
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        const result = await userService.logout(req.token);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * GET /api/auth/users
 * Get all users (Admin only)
 */
router.get('/users', authenticate, requireAdmin, async (req, res) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/auth/users/:id/deactivate
 * Deactivate a user (Admin only)
 */
router.patch('/users/:id/deactivate', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await userService.deactivateUser(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

/**
 * DELETE /api/auth/users/:id
 * Delete a user (Admin only)
 */
router.delete('/users/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const result = await userService.deleteUser(req.params.id);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

module.exports = router;
