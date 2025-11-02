const express = require('express');
const router = express.Router();
const {
  createUser,
  activation,
  loginUser,
  getUser,
  logout,
  updateUserInfo,
  updateAvatar,
  getAllUsers,
  deleteUser,
} = require('../controllers/userController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/create-user', createUser);
router.post('/activation', activation);
router.get('/activation/:token', (req, res) => {
  // Redirect to frontend activation page
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/activation/${req.params.token}`);
});
router.post('/login-user', loginUser);

// Protected routes
router.get('/getuser', isAuthenticated, getUser);
router.get('/logout', isAuthenticated, logout);
router.put('/update-user-info', isAuthenticated, updateUserInfo);
router.put('/update-avatar', isAuthenticated, updateAvatar);

// Admin routes
router.get('/admin-all-users', isAuthenticated, authorizeRoles('admin'), getAllUsers);
router.delete('/delete-user/:id', isAuthenticated, authorizeRoles('admin'), deleteUser);

module.exports = router;