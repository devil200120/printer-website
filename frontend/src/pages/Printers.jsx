import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import api from "../config/api";
import {
  FiPrinter,
  FiPlus,
  FiEdit,
  FiTrash,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiRefreshCw,
  FiWifi,
  FiCpu,
  FiHardDrive,
} from "react-icons/fi";
import toast from "react-hot-toast";

const Printers = () => {
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState(null);
  const [discoveredPrinters, setDiscoveredPrinters] = useState([]);
  const [discovering, setDiscovering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "usb",
    connectionString: "",
    isDefault: false,
  });

  useEffect(() => {
    fetchPrinters();
  }, []);

  const fetchPrinters = async () => {
    try {
      setLoading(true);
      const response = await api.get("/printer/all");
      setPrinters(response.data.printers);
    } catch (error) {
      toast.error("Failed to fetch printers");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPrinter) {
        await api.put(`/printer/update/${editingPrinter._id}`, formData);
        toast.success("Printer updated successfully");
      } else {
        await api.post("/printer/add", formData);
        toast.success("Printer added successfully");
      }

      setShowModal(false);
      setEditingPrinter(null);
      setFormData({
        name: "",
        type: "usb",
        connectionString: "",
        isDefault: false,
      });
      fetchPrinters();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleEdit = (printer) => {
    setEditingPrinter(printer);
    setFormData({
      name: printer.name,
      type: printer.type,
      connectionString: printer.connectionString,
      isDefault: printer.isDefault,
    });
    setShowModal(true);
  };

  const handleDelete = async (printerId) => {
    if (window.confirm("Are you sure you want to delete this printer?")) {
      try {
        await api.delete(`/printer/delete/${printerId}`);
        toast.success("Printer deleted successfully");
        fetchPrinters();
      } catch (error) {
        toast.error("Failed to delete printer");
      }
    }
  };

  const handleTest = async (printerId) => {
    try {
      await api.post(`/printer/test/${printerId}`);
      toast.success("Printer test successful");
      fetchPrinters();
    } catch (error) {
      toast.error("Printer test failed: " + error.response?.data?.message);
    }
  };

  const handleSetDefault = async (printerId) => {
    try {
      await api.put(`/printer/set-default/${printerId}`);
      toast.success("Default printer set successfully");
      fetchPrinters();
    } catch (error) {
      toast.error("Failed to set default printer");
    }
  };

  // Printer discovery functions
  const handleDiscoverPrinters = async (quickScan = true) => {
    try {
      setDiscovering(true);
      toast.loading("Scanning for printers...", { id: "discovery" });

      const response = await api.get(`/printer/discover?quick=${quickScan}`);
      setDiscoveredPrinters(response.data.printers);

      toast.success(
        `Found ${response.data.printers.length} available printers`,
        { id: "discovery" }
      );
    } catch (error) {
      toast.error("Printer discovery failed", { id: "discovery" });
      console.error("Discovery error:", error);
    } finally {
      setDiscovering(false);
    }
  };

  const handleSelectDiscoveredPrinter = (discoveredPrinter) => {
    setFormData({
      name: discoveredPrinter.name,
      type: discoveredPrinter.type,
      connectionString: discoveredPrinter.connectionString,
      isDefault: false,
    });
    setShowDiscoveryModal(false);
    setShowModal(true);
  };

  const getDiscoveryIcon = (type) => {
    switch (type) {
      case "usb":
        return <FiHardDrive className="w-5 h-5" />;
      case "network":
        return <FiWifi className="w-5 h-5" />;
      case "wifi":
        return <FiWifi className="w-5 h-5" />;
      case "bluetooth":
        return <FiWifi className="w-5 h-5" />; // Using WiFi icon as placeholder
      case "serial":
        return <FiCpu className="w-5 h-5" />;
      default:
        return <FiPrinter className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading printers..." />
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
              Printer Management
            </h1>
            <p className="text-gray-600">
              Configure and manage thermal printers
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setDiscoveredPrinters([]);
                setShowDiscoveryModal(true);
                handleDiscoverPrinters(true);
              }}
            >
              <FiSearch className="mr-2 h-4 w-4" />
              Discover Printers
            </Button>
            <Button
              onClick={() => {
                setEditingPrinter(null);
                setFormData({
                  name: "",
                  type: "usb",
                  connectionString: "",
                  isDefault: false,
                });
                setShowModal(true);
              }}
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Add Manually
            </Button>
          </div>
        </div>

        {/* Printers List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {printers.map((printer) => (
            <Card key={printer._id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <FiPrinter className="h-8 w-8 text-primary-600" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {printer.name}
                    </h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {printer.type} Connection
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {printer.isDefault && (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                      Default
                    </span>
                  )}
                  {printer.isConnected ? (
                    <FiCheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <FiXCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Connection:</span>{" "}
                  {printer.connectionString}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">Status:</span>
                  <span
                    className={
                      printer.isConnected ? "text-green-600" : "text-red-600"
                    }
                  >
                    {printer.isConnected ? " Connected" : " Disconnected"}
                  </span>
                </p>
                {printer.lastUsed && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium">Last Used:</span>{" "}
                    {new Date(printer.lastUsed).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTest(printer._id)}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(printer)}
                >
                  <FiEdit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                {!printer.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetDefault(printer._id)}
                  >
                    Set Default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(printer._id)}
                >
                  <FiTrash className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {printers.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FiPrinter className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500 text-lg">
                No printers configured
              </div>
              <p className="text-gray-400 mt-2">
                Add your first thermal printer to get started!
              </p>
              <Button className="mt-4" onClick={() => setShowModal(true)}>
                <FiPlus className="mr-2 h-4 w-4" />
                Add Printer
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Add/Edit Printer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingPrinter ? "Edit Printer" : "Add Printer"}
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPrinter ? "Update" : "Add"} Printer
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Printer Name"
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            required
            placeholder="e.g., Main Counter Printer"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connection Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="usb">USB</option>
              <option value="network">Network (IP)</option>
              <option value="wifi">WiFi</option>
              <option value="bluetooth">Bluetooth</option>
              <option value="serial">Serial (COM)</option>
            </select>
          </div>

          <Input
            label="Connection String"
            type="text"
            value={formData.connectionString}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                connectionString: e.target.value,
              }))
            }
            required
            placeholder={
              formData.type === "network" || formData.type === "wifi"
                ? "e.g., 192.168.1.100:9100"
                : formData.type === "serial"
                ? "e.g., COM1"
                : formData.type === "bluetooth"
                ? "e.g., 00:11:22:33:44:55 or device name"
                : "Auto-detect USB printer"
            }
          />

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isDefault: e.target.checked,
                }))
              }
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label
              htmlFor="isDefault"
              className="ml-2 block text-sm text-gray-900"
            >
              Set as default printer
            </label>
          </div>
        </form>
      </Modal>

      {/* Printer Discovery Modal */}
      <Modal
        isOpen={showDiscoveryModal}
        onClose={() => setShowDiscoveryModal(false)}
        title="Discover Printers"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDiscoveryModal(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => handleDiscoverPrinters(false)}
              disabled={discovering}
            >
              <FiRefreshCw
                className={`mr-2 h-4 w-4 ${discovering ? "animate-spin" : ""}`}
              />
              Full Scan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Discovery Controls */}
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <h4 className="font-medium text-blue-900">
                Automatic Printer Discovery
              </h4>
              <p className="text-sm text-blue-700">
                Scanning for USB, Serial, and Network printers...
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleDiscoverPrinters(true)}
              disabled={discovering}
            >
              <FiRefreshCw
                className={`mr-2 h-3 w-3 ${discovering ? "animate-spin" : ""}`}
              />
              Quick Scan
            </Button>
          </div>

          {/* Discovery Progress */}
          {discovering && (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="md" text="Scanning for printers..." />
            </div>
          )}

          {/* Discovered Printers List */}
          {!discovering && discoveredPrinters.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                Found {discoveredPrinters.length} Available Printers
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {discoveredPrinters.map((printer) => (
                  <div
                    key={printer.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                    onClick={() => handleSelectDiscoveredPrinter(printer)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-600">
                          {getDiscoveryIcon(printer.type)}
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {printer.name}
                          </h5>
                          <p className="text-sm text-gray-500">
                            {printer.description}
                          </p>
                          <p className="text-xs text-gray-400">
                            {printer.type.toUpperCase()}:{" "}
                            {printer.connectionString}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {printer.status}
                        </span>
                        <FiPlus className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Printers Found */}
          {!discovering && discoveredPrinters.length === 0 && (
            <div className="text-center py-8">
              <FiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Printers Found
              </h4>
              <p className="text-gray-500">
                No automatic printers detected. You can still add printers
                manually.
              </p>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => {
                  setShowDiscoveryModal(false);
                  setShowModal(true);
                }}
              >
                Add Manually
              </Button>
            </div>
          )}

          {/* Discovery Tips */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Discovery Tips:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>
                • <strong>USB:</strong> Connect printer via USB cable
              </li>
              <li>
                • <strong>Network/WiFi:</strong> Ensure printer is on same
                network
              </li>
              <li>
                • <strong>Bluetooth:</strong> Pair printer in Windows settings
                first
              </li>
              <li>
                • <strong>Serial:</strong> Check COM port connections
              </li>
              <li>
                • <strong>Full Scan:</strong> May take longer but finds all
                printer types
              </li>
            </ul>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};

export default Printers;
