const { SerialPort } = require('serialport');
const net = require('net');
const os = require('os');

class PrinterDiscoveryService {
  constructor() {
    this.discoveredPrinters = [];
  }

  // Discover all available printers
  async discoverAllPrinters() {
    try {
      const results = await Promise.allSettled([
        this.discoverUSBPrinters(),
        this.discoverNetworkPrinters(),
        this.discoverWiFiPrinters(),
        this.discoverBluetoothPrinters(),
        this.discoverSerialPrinters()
      ]);

      this.discoveredPrinters = [];

      // Combine all discovered printers
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          this.discoveredPrinters.push(...result.value);
        } else {
          console.warn(`Discovery method ${index} failed:`, result.reason);
        }
      });

      return this.discoveredPrinters;
    } catch (error) {
      console.error('Printer discovery failed:', error);
      throw error;
    }
  }

  // Discover USB printers
  async discoverUSBPrinters() {
    try {
      const usbPrinters = [];
      
      // Try to detect USB devices (simplified detection)
      // In a real implementation, you'd use node-usb or similar
      try {
        const escposUsb = require('escpos-usb');
        const devices = escposUsb.findPrinter();
        
        devices.forEach((device, index) => {
          usbPrinters.push({
            id: `usb_${index}`,
            name: `USB Thermal Printer ${index + 1}`,
            type: 'usb',
            connectionString: 'auto-detect',
            status: 'available',
            description: `USB Device: ${device.deviceDescriptor?.iProduct || 'Unknown'}`
          });
        });
      } catch (error) {
        // If no USB printers found or escpos-usb not available
        console.log('No USB printers detected or USB module not available');
      }

      return usbPrinters;
    } catch (error) {
      console.error('USB printer discovery failed:', error);
      return [];
    }
  }

  // Discover network printers by scanning common ports
  async discoverNetworkPrinters() {
    try {
      const networkPrinters = [];
      const commonPorts = [9100, 515, 631]; // Common printer ports
      const localNetworks = this.getLocalNetworkRanges();

      console.log('Scanning for network printers...');

      for (const network of localNetworks) {
        const promises = [];
        
        // Scan first 20 IPs in each network (to avoid long delays)
        for (let i = 1; i <= 20; i++) {
          const ip = `${network.base}.${i}`;
          
          for (const port of commonPorts) {
            promises.push(this.testNetworkConnection(ip, port));
          }
        }

        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            const { ip, port } = result.value;
            const existingPrinter = networkPrinters.find(p => p.connectionString.startsWith(ip));
            
            if (!existingPrinter) {
              networkPrinters.push({
                id: `network_${ip.replace(/\./g, '_')}_${port}`,
                name: `Network Printer (${ip})`,
                type: 'network',
                connectionString: `${ip}:${port}`,
                status: 'available',
                description: `Network device responding on port ${port}`
              });
            }
          }
        });
      }

      return networkPrinters;
    } catch (error) {
      console.error('Network printer discovery failed:', error);
      return [];
    }
  }

  // Discover serial/COM port printers
  async discoverSerialPrinters() {
    try {
      const serialPrinters = [];
      
      // Get list of available serial ports
      const ports = await SerialPort.list();
      
      for (const port of ports) {
        // Filter for likely printer ports (USB-to-Serial, COM ports)
        if (port.path && (
          port.path.includes('COM') || 
          port.path.includes('ttyUSB') || 
          port.path.includes('ttyACM') ||
          (port.manufacturer && port.manufacturer.toLowerCase().includes('ftdi')) ||
          (port.manufacturer && port.manufacturer.toLowerCase().includes('prolific'))
        )) {
          serialPrinters.push({
            id: `serial_${port.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: `Serial Printer (${port.path})`,
            type: 'serial',
            connectionString: port.path,
            status: 'available',
            description: `${port.manufacturer || 'Unknown'} - ${port.productId || 'Serial Device'}`
          });
        }
      }

      return serialPrinters;
    } catch (error) {
      console.error('Serial printer discovery failed:', error);
      return [];
    }
  }

  // Discover WiFi-enabled printers (mDNS/Bonjour discovery)
  async discoverWiFiPrinters() {
    try {
      const wifiPrinters = [];
      
      // Try to discover printers using mDNS (Bonjour/Zeroconf)
      try {
        const mdns = require('mdns');
        
        return new Promise((resolve) => {
          const browser = mdns.createBrowser(mdns.tcp('ipp'), mdns.tcp('printer'));
          const timeout = setTimeout(() => {
            browser.stop();
            resolve(wifiPrinters);
          }, 5000); // 5 second timeout

          browser.on('serviceUp', (service) => {
            wifiPrinters.push({
              id: `wifi_${service.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
              name: `WiFi Printer (${service.name})`,
              type: 'wifi',
              connectionString: `${service.addresses[0]}:${service.port}`,
              status: 'available',
              description: `WiFi: ${service.name} - ${service.type.name}`
            });
          });

          browser.on('serviceDown', (service) => {
            console.log('WiFi printer went down:', service.name);
          });

          browser.start();
        });
      } catch (error) {
        console.log('mDNS discovery not available, using alternative WiFi discovery');
        
        // Alternative: scan for common WiFi printer protocols
        const commonWiFiPorts = [9100, 515, 631, 8080, 80];
        const localNetworks = this.getLocalNetworkRanges();

        for (const network of localNetworks) {
          for (let i = 1; i <= 10; i++) { // Scan first 10 IPs
            const ip = `${network.base}.${i}`;
            
            for (const port of commonWiFiPorts) {
              try {
                const result = await this.testNetworkConnection(ip, port, 500);
                if (result) {
                  // Try to identify if it's a printer by checking common printer responses
                  const isWiFiPrinter = await this.identifyWiFiPrinter(ip, port);
                  if (isWiFiPrinter) {
                    wifiPrinters.push({
                      id: `wifi_${ip.replace(/\./g, '_')}_${port}`,
                      name: `WiFi Printer (${ip})`,
                      type: 'wifi',
                      connectionString: `${ip}:${port}`,
                      status: 'available',
                      description: `WiFi network printer on port ${port}`
                    });
                  }
                }
              } catch (err) {
                // Ignore individual connection failures
              }
            }
          }
        }
      }

      return wifiPrinters;
    } catch (error) {
      console.error('WiFi printer discovery failed:', error);
      return [];
    }
  }

  // Discover Bluetooth printers
  async discoverBluetoothPrinters() {
    try {
      const bluetoothPrinters = [];

      try {
        // Try using noble for Bluetooth LE discovery
        const noble = require('@abandonware/noble');
        
        return new Promise((resolve) => {
          const timeout = setTimeout(() => {
            noble.stopScanning();
            resolve(bluetoothPrinters);
          }, 10000); // 10 second timeout

          noble.on('stateChange', (state) => {
            if (state === 'poweredOn') {
              noble.startScanning(['18f0'], false); // Common printer service UUID
            }
          });

          noble.on('discover', (peripheral) => {
            const localName = peripheral.advertisement.localName;
            if (localName && (
              localName.toLowerCase().includes('printer') ||
              localName.toLowerCase().includes('pos') ||
              localName.toLowerCase().includes('receipt')
            )) {
              bluetoothPrinters.push({
                id: `bluetooth_${peripheral.id}`,
                name: `Bluetooth Printer (${localName})`,
                type: 'bluetooth',
                connectionString: peripheral.address || peripheral.id,
                status: 'available',
                description: `Bluetooth: ${localName} - RSSI: ${peripheral.rssi}dBm`
              });
            }
          });

          // Start discovery
          if (noble.state === 'poweredOn') {
            noble.startScanning(['18f0'], false);
          }
        });
      } catch (error) {
        console.log('Noble Bluetooth library not available, using alternative discovery');
        
        // Alternative: Use Windows PowerShell for Bluetooth discovery (Windows only)
        if (process.platform === 'win32') {
          try {
            const { exec } = require('child_process');
            
            return new Promise((resolve) => {
              exec('powershell "Get-PnpDevice -Class Bluetooth | Where-Object {$_.FriendlyName -like \'*printer*\' -or $_.FriendlyName -like \'*POS*\'} | Select-Object FriendlyName, InstanceId"', 
                (error, stdout) => {
                  if (!error && stdout) {
                    const lines = stdout.split('\n');
                    lines.forEach((line, index) => {
                      if (line.includes('printer') || line.includes('POS')) {
                        bluetoothPrinters.push({
                          id: `bluetooth_win_${index}`,
                          name: `Bluetooth Printer (${line.trim()})`,
                          type: 'bluetooth',
                          connectionString: 'auto-pair',
                          status: 'available',
                          description: `Windows Bluetooth: ${line.trim()}`
                        });
                      }
                    });
                  }
                  resolve(bluetoothPrinters);
                });
            });
          } catch (err) {
            console.log('Windows Bluetooth discovery failed');
            return bluetoothPrinters;
          }
        }
      }

      return bluetoothPrinters;
    } catch (error) {
      console.error('Bluetooth printer discovery failed:', error);
      return [];
    }
  }

  // Helper method to identify if a network device is a printer
  async identifyWiFiPrinter(ip, port) {
    try {
      // Simple check - try to connect and see if it responds like a printer
      const socket = new net.Socket();
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          socket.destroy();
          resolve(false);
        }, 1000);

        socket.on('connect', () => {
          // Send a simple ESC/POS command to test if it's a printer
          socket.write('\x1B\x40'); // ESC @ (initialize printer)
          
          setTimeout(() => {
            clearTimeout(timeout);
            socket.destroy();
            resolve(true); // If we can connect and send data, likely a printer
          }, 500);
        });

        socket.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });

        socket.connect(port, ip);
      });
    } catch (error) {
      return false;
    }
  }

  // Test network connection to see if a printer responds
  async testNetworkConnection(ip, port, timeout = 1000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      
      const timer = setTimeout(() => {
        socket.destroy();
        resolve(null);
      }, timeout);

      socket.setTimeout(timeout);
      
      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve({ ip, port });
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve(null);
      });

      socket.on('timeout', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(null);
      });

      socket.connect(port, ip);
    });
  }

  // Get local network ranges for scanning
  getLocalNetworkRanges() {
    const networks = [];
    const interfaces = os.networkInterfaces();

    Object.keys(interfaces).forEach(ifaceName => {
      const iface = interfaces[ifaceName];
      
      iface.forEach(config => {
        if (config.family === 'IPv4' && !config.internal && config.address) {
          const parts = config.address.split('.');
          if (parts.length === 4) {
            const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
            networks.push({ base, interface: ifaceName });
          }
        }
      });
    });

    return networks;
  }

  // Quick discovery for immediate results (USB, Serial, and nearby WiFi/Bluetooth)
  async quickDiscovery() {
    try {
      const results = await Promise.allSettled([
        this.discoverUSBPrinters(),
        this.discoverSerialPrinters(),
        this.discoverBluetoothPrinters() // Include Bluetooth in quick scan
      ]);

      const printers = [];
      results.forEach(result => {
        if (result.status === 'fulfilled') {
          printers.push(...result.value);
        }
      });

      return printers;
    } catch (error) {
      console.error('Quick discovery failed:', error);
      return [];
    }
  }

  // Get cached discovered printers
  getCachedPrinters() {
    return this.discoveredPrinters;
  }
}

module.exports = new PrinterDiscoveryService();