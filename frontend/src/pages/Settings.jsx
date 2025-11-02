import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import api from "../config/api";
import {
  FiSettings,
  FiSave,
  FiRefreshCw,
  FiMonitor,
  FiPrinter,
  FiVolume2,
  FiWifi,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    system: {
      companyName: "",
      autoStartDisplay: true,
      enableSounds: true,
      theme: "light",
      language: "en",
    },
    display: {
      refreshInterval: 5000,
      showWelcomeMessage: true,
      welcomeMessage: "Welcome! Please take a token.",
      fontSize: "medium",
      showLogo: true,
    },
    printer: {
      enableAutoPrint: true,
      printTokenDetails: true,
      paperSize: "58mm",
      printQuality: "normal",
    },
    network: {
      serverPort: 8000,
      socketPort: 8000,
      enableSSL: false,
      maxConnections: 100,
    },
  });
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get("/settings");
      if (response.data.settings) {
        setSettings((prev) => ({ ...prev, ...response.data.settings }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put("/settings", settings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    }
  };

  const handleReset = async () => {
    try {
      await api.post("/settings/reset");
      toast.success("Settings reset to defaults");
      setShowResetModal(false);
      fetchSettings();
    } catch (error) {
      console.error("Failed to reset settings:", error);
      toast.error("Failed to reset settings");
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading settings..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              System Settings
            </h1>
            <p className="text-gray-600">
              Configure system preferences and behavior
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setShowResetModal(true)}>
              <FiRefreshCw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave}>
              <FiSave className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <Card>
            <div className="flex items-center mb-4">
              <FiSettings className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                System Settings
              </h2>
            </div>
            <div className="space-y-4">
              <Input
                label="Company Name"
                type="text"
                value={settings.system.companyName}
                onChange={(e) =>
                  updateSetting("system", "companyName", e.target.value)
                }
                placeholder="Enter your company name"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select
                  value={settings.system.theme}
                  onChange={(e) =>
                    updateSetting("system", "theme", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select
                  value={settings.system.language}
                  onChange={(e) =>
                    updateSetting("system", "language", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                  <option value="te">Telugu</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoStartDisplay"
                  checked={settings.system.autoStartDisplay}
                  onChange={(e) =>
                    updateSetting(
                      "system",
                      "autoStartDisplay",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="autoStartDisplay"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Auto-start display screen on system startup
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSounds"
                  checked={settings.system.enableSounds}
                  onChange={(e) =>
                    updateSetting("system", "enableSounds", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="enableSounds"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable notification sounds
                </label>
              </div>
            </div>
          </Card>

          {/* Display Settings */}
          <Card>
            <div className="flex items-center mb-4">
              <FiMonitor className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Display Settings
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refresh Interval (ms)
                </label>
                <input
                  type="number"
                  value={settings.display.refreshInterval}
                  onChange={(e) =>
                    updateSetting(
                      "display",
                      "refreshInterval",
                      parseInt(e.target.value)
                    )
                  }
                  min="1000"
                  max="30000"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <Input
                label="Welcome Message"
                type="text"
                value={settings.display.welcomeMessage}
                onChange={(e) =>
                  updateSetting("display", "welcomeMessage", e.target.value)
                }
                placeholder="Enter welcome message"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Font Size
                </label>
                <select
                  value={settings.display.fontSize}
                  onChange={(e) =>
                    updateSetting("display", "fontSize", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xlarge">Extra Large</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showWelcomeMessage"
                  checked={settings.display.showWelcomeMessage}
                  onChange={(e) =>
                    updateSetting(
                      "display",
                      "showWelcomeMessage",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showWelcomeMessage"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Show welcome message on display
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={settings.display.showLogo}
                  onChange={(e) =>
                    updateSetting("display", "showLogo", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="showLogo"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Show company logo on display
                </label>
              </div>
            </div>
          </Card>

          {/* Printer Settings */}
          <Card>
            <div className="flex items-center mb-4">
              <FiPrinter className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Printer Settings
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paper Size
                </label>
                <select
                  value={settings.printer.paperSize}
                  onChange={(e) =>
                    updateSetting("printer", "paperSize", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="58mm">58mm</option>
                  <option value="80mm">80mm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Print Quality
                </label>
                <select
                  value={settings.printer.printQuality}
                  onChange={(e) =>
                    updateSetting("printer", "printQuality", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="draft">Draft</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAutoPrint"
                  checked={settings.printer.enableAutoPrint}
                  onChange={(e) =>
                    updateSetting(
                      "printer",
                      "enableAutoPrint",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="enableAutoPrint"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Auto-print tokens when generated
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="printTokenDetails"
                  checked={settings.printer.printTokenDetails}
                  onChange={(e) =>
                    updateSetting(
                      "printer",
                      "printTokenDetails",
                      e.target.checked
                    )
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="printTokenDetails"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Print detailed token information
                </label>
              </div>
            </div>
          </Card>

          {/* Network Settings */}
          <Card>
            <div className="flex items-center mb-4">
              <FiWifi className="h-6 w-6 text-primary-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Network Settings
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Server Port
                </label>
                <input
                  type="number"
                  value={settings.network.serverPort}
                  onChange={(e) =>
                    updateSetting(
                      "network",
                      "serverPort",
                      parseInt(e.target.value)
                    )
                  }
                  min="1000"
                  max="65535"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Socket Port
                </label>
                <input
                  type="number"
                  value={settings.network.socketPort}
                  onChange={(e) =>
                    updateSetting(
                      "network",
                      "socketPort",
                      parseInt(e.target.value)
                    )
                  }
                  min="1000"
                  max="65535"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Connections
                </label>
                <input
                  type="number"
                  value={settings.network.maxConnections}
                  onChange={(e) =>
                    updateSetting(
                      "network",
                      "maxConnections",
                      parseInt(e.target.value)
                    )
                  }
                  min="10"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSSL"
                  checked={settings.network.enableSSL}
                  onChange={(e) =>
                    updateSetting("network", "enableSSL", e.target.checked)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="enableSSL"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable SSL/HTTPS (requires certificate)
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Reset Settings"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowResetModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </>
        }
      >
        <div className="text-gray-600">
          <p>
            Are you sure you want to reset all settings to their default values?
          </p>
          <p className="mt-2 text-sm text-red-600">
            <strong>Warning:</strong> This action cannot be undone. All your
            custom settings will be lost.
          </p>
        </div>
      </Modal>
    </Layout>
  );
};

export default Settings;
