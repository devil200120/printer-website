const Printer = require('../models/Printer');
const ErrorHandler = require('../utils/ErrorHandler');
const PrinterService = require('../services/PrinterService');
const PrinterDiscoveryService = require('../services/PrinterDiscoveryService');

// Get all printers
exports.getAllPrinters = async (req, res, next) => {
  try {
    const printers = await Printer.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      printers,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Add new printer
exports.addPrinter = async (req, res, next) => {
  try {
    const { name, type, connectionString, isDefault, settings } = req.body;

    // If this is set as default, unset all other defaults
    if (isDefault) {
      await Printer.updateMany({}, { isDefault: false });
    }

    const printer = await Printer.create({
      name,
      type,
      connectionString,
      isDefault: isDefault || false,
      settings: settings || {},
    });

    res.status(201).json({
      success: true,
      printer,
      message: 'Printer added successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update printer
exports.updatePrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;
    const { name, type, connectionString, isDefault, settings } = req.body;

    const printer = await Printer.findById(printerId);
    
    if (!printer) {
      return next(new ErrorHandler('Printer not found', 404));
    }

    // If this is set as default, unset all other defaults
    if (isDefault) {
      await Printer.updateMany({ _id: { $ne: printerId } }, { isDefault: false });
    }

    const updatedPrinter = await Printer.findByIdAndUpdate(
      printerId,
      {
        name,
        type,
        connectionString,
        isDefault: isDefault || false,
        settings: settings || printer.settings,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      printer: updatedPrinter,
      message: 'Printer updated successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Delete printer
exports.deletePrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    const printer = await Printer.findById(printerId);
    
    if (!printer) {
      return next(new ErrorHandler('Printer not found', 404));
    }

    await Printer.findByIdAndDelete(printerId);

    res.status(200).json({
      success: true,
      message: 'Printer deleted successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Test printer connection
exports.testPrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    try {
      await PrinterService.initializePrinter(printerId);
      await PrinterService.testPrinter();
      
      // Update printer status
      await Printer.findByIdAndUpdate(printerId, { 
        isConnected: true,
        lastUsed: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'Printer test successful',
      });
    } catch (error) {
      // Update printer status as disconnected
      await Printer.findByIdAndUpdate(printerId, { 
        isConnected: false 
      });
      
      throw error;
    }
  } catch (error) {
    return next(new ErrorHandler(`Printer test failed: ${error.message}`, 500));
  }
};

// Get printer status
exports.getPrinterStatus = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    const printer = await Printer.findById(printerId);
    
    if (!printer) {
      return next(new ErrorHandler('Printer not found', 404));
    }

    let status = 'disconnected';
    
    try {
      await PrinterService.initializePrinter(printerId);
      status = 'connected';
      
      // Update printer status
      await Printer.findByIdAndUpdate(printerId, { 
        isConnected: true 
      });
    } catch (error) {
      await Printer.findByIdAndUpdate(printerId, { 
        isConnected: false 
      });
    }

    res.status(200).json({
      success: true,
      status,
      printer,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Set default printer
exports.setDefaultPrinter = async (req, res, next) => {
  try {
    const { printerId } = req.params;

    const printer = await Printer.findById(printerId);
    
    if (!printer) {
      return next(new ErrorHandler('Printer not found', 404));
    }

    // Unset all other defaults
    await Printer.updateMany({}, { isDefault: false });
    
    // Set this as default
    printer.isDefault = true;
    await printer.save();

    res.status(200).json({
      success: true,
      printer,
      message: 'Default printer set successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Discover available printers
exports.discoverPrinters = async (req, res, next) => {
  try {
    const { quick = false } = req.query;
    
    let discoveredPrinters;
    
    if (quick === 'true') {
      // Quick discovery (USB and Serial only)
      discoveredPrinters = await PrinterDiscoveryService.quickDiscovery();
    } else {
      // Full discovery (includes network scan)
      discoveredPrinters = await PrinterDiscoveryService.discoverAllPrinters();
    }

    res.status(200).json({
      success: true,
      printers: discoveredPrinters,
      message: `Found ${discoveredPrinters.length} available printers`,
    });
  } catch (error) {
    return next(new ErrorHandler(`Printer discovery failed: ${error.message}`, 500));
  }
};

// Get cached discovered printers
exports.getCachedDiscoveredPrinters = async (req, res, next) => {
  try {
    const cachedPrinters = PrinterDiscoveryService.getCachedPrinters();

    res.status(200).json({
      success: true,
      printers: cachedPrinters,
      message: `${cachedPrinters.length} printers in cache`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};