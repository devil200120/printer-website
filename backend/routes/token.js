const express = require('express');
const router = express.Router();
const {
  getTokenSystemStatus,
  updateTokenSystem,
  printToken,
  getAllTokens,
  updateTokenStatus,
  resetTokenSystem,
  getTokenStatistics,
  reprintToken,
} = require('../controllers/tokenController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Token system management
router.get('/system/status', getTokenSystemStatus);
router.put('/system/update', authorizeRoles('admin'), updateTokenSystem);
router.post('/system/reset', authorizeRoles('admin'), resetTokenSystem);

// Token operations
router.post('/print', printToken);
router.post('/reprint/:tokenId', reprintToken);
router.get('/all', getAllTokens);
router.put('/status/:tokenId', updateTokenStatus);

// Statistics
router.get('/statistics', getTokenStatistics);

module.exports = router;