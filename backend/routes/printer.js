const express = require('express');
const router = express.Router();
const {
  getAllPrinters,
  addPrinter,
  updatePrinter,
  deletePrinter,
  testPrinter,
  getPrinterStatus,
  setDefaultPrinter,
  discoverPrinters,
  getCachedDiscoveredPrinters,
} = require('../controllers/printerController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(isAuthenticated);

// Printer management
router.get('/all', getAllPrinters);
router.post('/add', authorizeRoles('admin'), addPrinter);
router.put('/update/:printerId', authorizeRoles('admin'), updatePrinter);
router.delete('/delete/:printerId', authorizeRoles('admin'), deletePrinter);

// Printer operations
router.post('/test/:printerId', testPrinter);
router.get('/status/:printerId', getPrinterStatus);
router.put('/set-default/:printerId', authorizeRoles('admin'), setDefaultPrinter);

// Printer discovery
router.get('/discover', discoverPrinters);
router.get('/discover/cached', getCachedDiscoveredPrinters);

module.exports = router;