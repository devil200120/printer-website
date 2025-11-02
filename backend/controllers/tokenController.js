const Token = require('../models/Token');
const TokenSystem = require('../models/TokenSystem');
const ErrorHandler = require('../utils/ErrorHandler');
const PrinterService = require('../services/PrinterService');

// Get socket.io instance for real-time updates
let io;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Broadcast token system updates to display screens
const broadcastTokenUpdate = (tokenSystem) => {
  if (io) {
    // Emit to display room (public displays)
    io.to('displayRoom').emit('tokenSystemUpdate', {
      tokenSystem,
      timestamp: new Date(),
    });
    // Also emit to all connected clients (admin dashboards, etc.)
    io.emit('tokenSystemUpdate', {
      tokenSystem,
      timestamp: new Date(),
    });
    console.log('Broadcasting token system update:', {
      totalTokens: tokenSystem.totalTokens,
      usedTokens: tokenSystem.usedTokens,
      remainingTokens: tokenSystem.remainingTokens,
      currentTokenNumber: tokenSystem.currentTokenNumber
    });
  }
};

// Get token system status
exports.getTokenSystemStatus = async (req, res, next) => {
  try {
    let tokenSystem = await TokenSystem.findOne({ isActive: true }).populate('updatedBy', 'name email');
    
    if (!tokenSystem) {
      // Create default token system if none exists
      tokenSystem = await TokenSystem.create({
        totalTokens: 0,
        usedTokens: 0,
        remainingTokens: 0,
        currentTokenNumber: 0,
        updatedBy: req.user.id,
      });
    }

    res.status(200).json({
      success: true,
      tokenSystem,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update token system
exports.updateTokenSystem = async (req, res, next) => {
  try {
    const { totalTokens, usedTokens } = req.body;

    if (totalTokens < 0 || usedTokens < 0) {
      return next(new ErrorHandler('Token values cannot be negative', 400));
    }

    if (usedTokens > totalTokens) {
      return next(new ErrorHandler('Used tokens cannot exceed total tokens', 400));
    }

    let tokenSystem = await TokenSystem.findOne({ isActive: true });
    
    if (!tokenSystem) {
      tokenSystem = await TokenSystem.create({
        totalTokens,
        usedTokens,
        updatedBy: req.user.id,
      });
    } else {
      tokenSystem.totalTokens = totalTokens;
      tokenSystem.usedTokens = usedTokens;
      tokenSystem.remainingTokens = totalTokens - usedTokens;
      tokenSystem.updatedBy = req.user.id;
      await tokenSystem.save();
    }

    // Broadcast update to display screens
    broadcastTokenUpdate(tokenSystem);

    res.status(200).json({
      success: true,
      tokenSystem,
      message: 'Token system updated successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Print token
exports.printToken = async (req, res, next) => {
  try {
    const { quantity = 1 } = req.body;

    if (quantity <= 0 || quantity > 10) {
      return next(new ErrorHandler('Quantity must be between 1 and 10', 400));
    }

    let tokenSystem = await TokenSystem.findOne({ isActive: true });
    
    if (!tokenSystem) {
      return next(new ErrorHandler('Token system not initialized', 400));
    }

    if (tokenSystem.remainingTokens < quantity) {
      return next(new ErrorHandler('Not enough tokens remaining', 400));
    }

    const tokens = [];
    const printResults = [];

    // Create tokens
    for (let i = 0; i < quantity; i++) {
      tokenSystem.currentTokenNumber += 1;
      
      const token = await Token.create({
        tokenNumber: tokenSystem.currentTokenNumber,
        status: 'pending',
        createdBy: req.user.id,
        metadata: {
          printedAt: new Date(),
          printedBy: req.user.name,
        },
      });

      tokens.push(token);

      // Print token
      try {
        await PrinterService.printToken({
          tokenNumber: token.tokenNumber,
          createdAt: token.createdAt,
        });
        printResults.push({ 
          success: true, 
          tokenNumber: token.tokenNumber,
          message: `Token #${token.tokenNumber} printed successfully`
        });
      } catch (printError) {
        console.error('Print error for token #' + token.tokenNumber + ':', printError);
        
        // Provide detailed error messages based on error type
        let userFriendlyError = 'Unknown printing error';
        
        if (printError.message.includes('No printer configuration found')) {
          userFriendlyError = 'No printer configured. Please set up a printer first.';
        } else if (printError.message.includes('ENOENT') || printError.message.includes('device not found')) {
          userFriendlyError = 'Printer not found. Check if printer is connected and powered on.';
        } else if (printError.message.includes('EACCES') || printError.message.includes('permission denied')) {
          userFriendlyError = 'Permission denied. Check printer permissions.';
        } else if (printError.message.includes('timeout') || printError.message.includes('ETIMEDOUT')) {
          userFriendlyError = 'Printer connection timeout. Check if printer is responding.';
        } else if (printError.message.includes('ECONNREFUSED')) {
          userFriendlyError = 'Cannot connect to printer. Check network connection.';
        } else {
          userFriendlyError = `Printer error: ${printError.message}`;
        }
        
        printResults.push({ 
          success: false, 
          tokenNumber: token.tokenNumber, 
          error: userFriendlyError,
          technicalError: printError.message
        });
      }
    }

    // Don't increment usedTokens here - only when admin marks as completed
    // tokenSystem.usedTokens += quantity; // Removed this line
    await tokenSystem.save();

    // Broadcast updates to display screens
    broadcastTokenUpdate(tokenSystem);
    if (io) {
      io.to('displayRoom').emit('newTokensPrinted', tokens);
      // Also emit to all connected clients (including admin dashboard)
      io.emit('tokenSystemUpdate', {
        tokenSystem,
        timestamp: new Date(),
      });
      io.emit('newTokensPrinted', tokens);
      console.log(`📡 Broadcasting new tokens printed: ${tokens.length} tokens to all clients`);
    }

    // Prepare response with detailed status
    const successCount = printResults.filter(r => r.success).length;
    const failCount = printResults.length - successCount;
    
    let responseMessage;
    let printStatus = 'success';
    
    if (failCount === 0) {
      responseMessage = `All ${successCount} token(s) created successfully! Capacity will be used when tokens are completed.`;
    } else if (successCount === 0) {
      responseMessage = `Failed to print all ${failCount} token(s). Tokens created but not printed.`;
      printStatus = 'failed';
    } else {
      responseMessage = `${successCount} token(s) created successfully, ${failCount} failed. Check printer connection.`;
      printStatus = 'partial';
    }

    res.status(200).json({
      success: true,
      tokens,
      printResults,
      tokenSystem,
      printStatus,
      successCount,
      failCount,
      message: responseMessage,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Get all tokens
exports.getAllTokens = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const tokens = await Token.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalTokens = await Token.countDocuments();
    const totalPages = Math.ceil(totalTokens / limit);

    res.status(200).json({
      success: true,
      tokens,
      pagination: {
        currentPage: page,
        totalPages,
        totalTokens,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Update token status
exports.updateTokenStatus = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const { status } = req.body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return next(new ErrorHandler('Invalid status value', 400));
    }

    const token = await Token.findById(tokenId);
    
    if (!token) {
      return next(new ErrorHandler('Token not found', 404));
    }

    const previousStatus = token.status;
    token.status = status;
    
    if (status === 'completed') {
      token.completedAt = new Date();
    } else if (status === 'cancelled') {
      token.cancelledAt = new Date();
    }

    await token.save();

    // Update token system counters when status changes
    const tokenSystem = await TokenSystem.findOne({ isActive: true });
    if (tokenSystem) {
      console.log(`Token #${token.tokenNumber}: ${previousStatus} → ${status}`);
      
      if (status === 'completed' && previousStatus !== 'completed') {
        // Token is being marked as completed - increment usedTokens
        tokenSystem.usedTokens += 1;
        console.log(`✅ Token #${token.tokenNumber} completed. Used tokens: ${tokenSystem.usedTokens - 1} → ${tokenSystem.usedTokens}`);
      } else if (previousStatus === 'completed' && status !== 'completed') {
        // Token was completed but now changed to pending/cancelled - decrement usedTokens
        const oldUsed = tokenSystem.usedTokens;
        tokenSystem.usedTokens = Math.max(0, tokenSystem.usedTokens - 1);
        console.log(`↩️ Token #${token.tokenNumber} uncompleted. Used tokens: ${oldUsed} → ${tokenSystem.usedTokens}`);
      }
      
      // When token is cancelled, we don't change totalTokens, but we should track it differently
      // Cancelled tokens should not count towards usedTokens, freeing up capacity
      if (status === 'cancelled' && previousStatus === 'pending') {
        // Token was pending and now cancelled - this frees up capacity
        // No change to usedTokens needed as pending tokens don't count as used
        console.log(`❌ Token #${token.tokenNumber} cancelled - capacity freed up`);
      }
      
      await tokenSystem.save();
      
      // Broadcast token system update
      broadcastTokenUpdate(tokenSystem);
    }

    // Emit real-time update to all clients
    const io = req.app.get('io');
    io.emit('tokenStatusUpdate', token);
    io.to('displayRoom').emit('tokenStatusUpdate', token);
    console.log(`Broadcasting token status update: Token #${token.tokenNumber} → ${token.status}`);

    res.status(200).json({
      success: true,
      token,
      message: 'Token status updated successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Reset token system
exports.resetTokenSystem = async (req, res, next) => {
  try {
    let tokenSystem = await TokenSystem.findOne({ isActive: true });
    
    if (!tokenSystem) {
      return next(new ErrorHandler('Token system not found', 404));
    }

    // Reset all values
    tokenSystem.totalTokens = 0;
    tokenSystem.usedTokens = 0;
    tokenSystem.currentTokenNumber = 0;
    tokenSystem.lastResetDate = new Date();
    tokenSystem.updatedBy = req.user.id;
    
    await tokenSystem.save();

    // Emit real-time update
    req.app.get('io').emit('tokenSystemReset', tokenSystem);

    res.status(200).json({
      success: true,
      tokenSystem,
      message: 'Token system reset successfully',
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Get token statistics
exports.getTokenStatistics = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's statistics
    const todayStats = await Token.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total statistics
    const totalStats = await Token.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const tokenSystem = await TokenSystem.findOne({ isActive: true });

    res.status(200).json({
      success: true,
      statistics: {
        today: todayStats,
        total: totalStats,
        system: tokenSystem,
      },
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Reprint individual token
exports.reprintToken = async (req, res, next) => {
  try {
    const { tokenId } = req.params;

    const token = await Token.findById(tokenId);
    
    if (!token) {
      return next(new ErrorHandler('Token not found', 404));
    }

    let printResult;
    try {
      await PrinterService.printToken({
        tokenNumber: token.tokenNumber,
        createdAt: token.createdAt,
      });
      printResult = { 
        success: true, 
        tokenNumber: token.tokenNumber,
        message: `Token #${token.tokenNumber} reprinted successfully`
      };
    } catch (printError) {
      console.error('Reprint error for token #' + token.tokenNumber + ':', printError);
      
      // Provide detailed error messages based on error type
      let userFriendlyError = 'Unknown printing error';
      
      if (printError.message.includes('No printer configuration found')) {
        userFriendlyError = 'No printer configured. Please set up a printer first.';
      } else if (printError.message.includes('ENOENT') || printError.message.includes('device not found')) {
        userFriendlyError = 'Printer not found. Check if printer is connected and powered on.';
      } else if (printError.message.includes('EACCES') || printError.message.includes('permission denied')) {
        userFriendlyError = 'Permission denied. Check printer permissions.';
      } else if (printError.message.includes('timeout') || printError.message.includes('ETIMEDOUT')) {
        userFriendlyError = 'Printer connection timeout. Check if printer is responding.';
      } else if (printError.message.includes('ECONNREFUSED')) {
        userFriendlyError = 'Cannot connect to printer. Check network connection.';
      } else {
        userFriendlyError = `Printer error: ${printError.message}`;
      }
      
      printResult = { 
        success: false, 
        tokenNumber: token.tokenNumber, 
        error: userFriendlyError,
        technicalError: printError.message
      };
    }

    res.status(200).json({
      success: printResult.success,
      token,
      printResult,
      message: printResult.success 
        ? `Token #${token.tokenNumber} reprinted successfully!` 
        : `Failed to reprint token #${token.tokenNumber}: ${printResult.error}`,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 500));
  }
};

// Export socket setup function
exports.setSocketIO = setSocketIO;