const escpos = require('escpos');
const moment = require('moment');
const Printer = require('../models/Printer');

class PrinterService {
  constructor() {
    this.device = null;
    this.printer = null;
    this.isConnected = false;
  }

  // Initialize printer connection
  async initializePrinter(printerId = null) {
    try {
      let printerConfig;
      
      if (printerId) {
        printerConfig = await Printer.findById(printerId);
      } else {
        printerConfig = await Printer.findOne({ isDefault: true });
      }

      if (!printerConfig) {
        throw new Error('No printer configuration found');
      }

      switch (printerConfig.type) {
        case 'usb':
          // For USB connection
          const USB = require('escpos-usb');
          this.device = new USB();
          break;
        case 'network':
        case 'wifi':
          // For network/WiFi connection
          const Network = require('escpos-network');
          const [host, port] = printerConfig.connectionString.split(':');
          this.device = new Network(host, parseInt(port) || 9100);
          break;
        case 'serial':
          // For serial connection
          const Serial = require('escpos-serialport');
          this.device = new Serial(printerConfig.connectionString);
          break;
        case 'bluetooth':
          // For Bluetooth connection
          try {
            const Bluetooth = require('escpos-bluetooth');
            this.device = new Bluetooth(printerConfig.connectionString);
          } catch (error) {
            console.warn('Bluetooth support not available, falling back to network mode');
            // Fallback: treat as network connection for Bluetooth-to-IP bridges
            const [btHost, btPort] = printerConfig.connectionString.split(':');
            if (btHost && btPort) {
              const Network = require('escpos-network');
              this.device = new Network(btHost, parseInt(btPort) || 9100);
            } else {
              throw new Error('Bluetooth connection failed and no fallback available');
            }
          }
          break;
        default:
          throw new Error('Unsupported printer type');
      }

      this.printer = new escpos.Printer(this.device);
      this.isConnected = true;
      
      // Update printer status
      await Printer.findByIdAndUpdate(printerConfig._id, { 
        isConnected: true,
        lastUsed: new Date()
      });

      return true;
    } catch (error) {
      console.error('Printer initialization failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Print token
  async printToken(tokenData) {
    try {
      if (!this.isConnected || !this.printer) {
        await this.initializePrinter();
      }

      await new Promise((resolve, reject) => {
        this.device.open((error) => {
          if (error) {
            reject(error);
            return;
          }

          const currentDate = moment().format('DD/MM/YYYY HH:mm:ss');
          
          this.printer
            .font('a')
            .align('ct')
            .style('bu')
            .size(1, 1)
            .text('TOKEN SYSTEM')
            .text('================')
            .text('')
            .size(2, 2)
            .style('b')
            .text(`TOKEN #${tokenData.tokenNumber}`)
            .text('')
            .size(1, 1)
            .style('normal')
            .text(`Date: ${currentDate}`)
            .text('')
            .text('Please wait for your turn')
            .text('================')
            .text('')
            .cut()
            .close(() => {
              resolve();
            });
        });
      });

      return true;
    } catch (error) {
      console.error('Print failed:', error);
      throw error;
    }
  }

  // Print multiple tokens
  async printMultipleTokens(tokens) {
    const results = [];
    
    for (const token of tokens) {
      try {
        await this.printToken(token);
        results.push({ success: true, tokenNumber: token.tokenNumber });
      } catch (error) {
        results.push({ 
          success: false, 
          tokenNumber: token.tokenNumber, 
          error: error.message 
        });
      }
    }

    return results;
  }

  // Test printer connection
  async testPrinter() {
    try {
      if (!this.isConnected || !this.printer) {
        await this.initializePrinter();
      }

      await new Promise((resolve, reject) => {
        this.device.open((error) => {
          if (error) {
            reject(error);
            return;
          }

          this.printer
            .font('a')
            .align('ct')
            .text('PRINTER TEST')
            .text('Connection Successful')
            .text(moment().format('DD/MM/YYYY HH:mm:ss'))
            .cut()
            .close(() => {
              resolve();
            });
        });
      });

      return true;
    } catch (error) {
      console.error('Printer test failed:', error);
      throw error;
    }
  }

  // Disconnect printer
  disconnect() {
    if (this.device) {
      this.device.close();
      this.isConnected = false;
    }
  }
}

module.exports = new PrinterService();