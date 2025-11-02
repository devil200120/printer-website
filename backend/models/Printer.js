const mongoose = require('mongoose');

const printerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['usb', 'network', 'serial'],
    required: true,
  },
  connectionString: {
    type: String,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  isConnected: {
    type: Boolean,
    default: false,
  },
  settings: {
    width: {
      type: Number,
      default: 48, // 48mm for thermal printers
    },
    fontSize: {
      type: String,
      default: 'normal',
    },
    autoCut: {
      type: Boolean,
      default: true,
    },
    encoding: {
      type: String,
      default: 'utf8',
    },
  },
  lastUsed: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Printer', printerSchema);