import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToken } from "../hooks/useAuth";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import {
  FiPrinter,
  FiUsers,
  FiActivity,
  FiSettings,
  FiRefreshCw,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiZap,
} from "react-icons/fi";

const Dashboard = () => {
  const { user } = useAuth();
  const {
    tokenSystem,
    loading,
    printing,
    loadTokenSystem,
    updateTokenSystem,
    printToken,
    resetTokenSystem,
  } = useToken();

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [tokenData, setTokenData] = useState({
    totalTokens: 0,
    usedTokens: 0,
  });
  const [printQuantity, setPrintQuantity] = useState(1);

  useEffect(() => {
    loadTokenSystem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount to prevent infinite loop

  useEffect(() => {
    if (tokenSystem) {
      setTokenData({
        totalTokens: tokenSystem.totalTokens,
        usedTokens: tokenSystem.usedTokens,
      });
    }
  }, [tokenSystem]);

  const handleUpdateTokens = async (e) => {
    e.preventDefault();
    const result = await updateTokenSystem(
      tokenData.totalTokens,
      tokenData.usedTokens
    );
    if (result.success) {
      setShowTokenModal(false);
    }
  };

  const handlePrintTokens = async (e) => {
    e.preventDefault();
    const result = await printToken(printQuantity);
    if (result.success) {
      setShowPrintModal(false);
      setPrintQuantity(1);
      
      // Show detailed print status
      if (result.printStatus === 'failed') {
        // Keep modal open for failed prints so user can try again
        console.log('Print failed - keeping modal open for retry');
      } else if (result.printStatus === 'partial') {
        console.log(`Partial success: ${result.successCount}/${printQuantity} printed`);
      }
    }
  };

  const handleReset = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset the token system? This will clear all data."
      )
    ) {
      await resetTokenSystem();
    }
  };

  if (loading && !tokenSystem) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading dashboard..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-8 py-6 text-white shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-blue-100 text-lg">
                Ready to manage your tokens today?
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <FiCheckCircle className="w-4 h-4 mr-1" />
                  System Active
                </div>
                <div className="flex items-center">
                  <FiClock className="w-4 h-4 mr-1" />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="hidden md:flex space-x-3">
              <Button
                variant="outline"
                onClick={() => loadTokenSystem()}
                disabled={loading}
                className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <FiRefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                onClick={() => setShowPrintModal(true)}
                disabled={printing}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                <FiPrinter className="mr-2 h-4 w-4" />
                Print Token
              </Button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Tokens Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Tokens
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {tokenSystem?.totalTokens || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiUsers className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-blue-100 text-sm">
                <FiTrendingUp className="w-4 h-4 mr-1" />
                System capacity
              </div>
            </div>
          </div>

          {/* Used Tokens Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Used Tokens
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {tokenSystem?.usedTokens || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiActivity className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-green-100 text-sm">
                <FiBarChart2 className="w-4 h-4 mr-1" />
                {tokenSystem?.totalTokens
                  ? `${Math.round(
                      (tokenSystem.usedTokens / tokenSystem.totalTokens) * 100
                    )}% utilized`
                  : "0% utilized"}
              </div>
            </div>
          </div>

          {/* Remaining Tokens Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Remaining
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {tokenSystem?.remainingTokens || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiZap className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-orange-100 text-sm">
                <FiAlertCircle className="w-4 h-4 mr-1" />
                Available now
              </div>
            </div>
          </div>

          {/* Current Token Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Current Token
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    #{tokenSystem?.currentTokenNumber || 0}
                  </p>
                </div>
                <div className="p-3 bg-white/20 rounded-lg">
                  <FiClock className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-purple-100 text-sm">
                <FiCheckCircle className="w-4 h-4 mr-1" />
                Now serving
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Actions - Show on small screens */}
        <div className="md:hidden grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => loadTokenSystem()}
            disabled={loading}
            className="py-3"
          >
            <FiRefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setShowPrintModal(true)}
            disabled={printing}
            className="py-3"
          >
            <FiPrinter className="mr-2 h-4 w-4" />
            Print Token
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Progress Chart */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiBarChart2 className="w-5 h-5 mr-2 text-blue-600" />
                  Token Usage Progress
                </h3>
                <span className="text-sm text-gray-500">
                  Updated{" "}
                  {tokenSystem?.updatedAt
                    ? new Date(tokenSystem.updatedAt).toLocaleTimeString()
                    : "Never"}
                </span>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Overall Progress
                    </span>
                    <span className="text-sm text-gray-500">
                      {tokenSystem?.totalTokens
                        ? `${Math.round(
                            (tokenSystem.usedTokens / tokenSystem.totalTokens) *
                              100
                          )}%`
                        : "0%"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${
                          tokenSystem?.totalTokens
                            ? (tokenSystem.usedTokens /
                                tokenSystem.totalTokens) *
                              100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{tokenSystem?.totalTokens || 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {tokenSystem?.totalTokens || 0}
                    </div>
                    <div className="text-sm text-blue-700">Total</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {tokenSystem?.usedTokens || 0}
                    </div>
                    <div className="text-sm text-green-700">Used</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {tokenSystem?.remainingTokens || 0}
                    </div>
                    <div className="text-sm text-orange-700">Remaining</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiZap className="w-5 h-5 mr-2 text-purple-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowPrintModal(true)}
                  disabled={printing}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <FiPrinter className="mr-2 h-4 w-4" />
                  {printing ? "Printing..." : "Print New Token"}
                </Button>

                {user?.role === "admin" && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setShowTokenModal(true)}
                      className="w-full py-3 border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                    >
                      <FiSettings className="mr-2 h-4 w-4" />
                      Update System
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleReset}
                      className="w-full py-3 border-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 transition-all duration-200"
                    >
                      <FiRefreshCw className="mr-2 h-4 w-4" />
                      Reset System
                    </Button>
                  </>
                )}
              </div>
            </Card>

            {/* System Status */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiActivity className="w-5 h-5 mr-2 text-green-600" />
                System Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Health</span>
                  <div className="flex items-center text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    <span className="text-sm font-medium">Online</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Printer Status</span>
                  <div className="flex items-center text-orange-600">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">Check Connection</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Activity</span>
                  <span className="text-sm text-gray-900">
                    {tokenSystem?.updatedAt
                      ? new Date(tokenSystem.updatedAt).toLocaleTimeString()
                      : "No activity"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Your Role</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user?.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Update Token System Modal */}
      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="Update Token System"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowTokenModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTokens} loading={loading}>
              Update
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateTokens} className="space-y-4">
          <Input
            label="Total Tokens"
            type="number"
            min="0"
            value={tokenData.totalTokens}
            onChange={(e) =>
              setTokenData((prev) => ({
                ...prev,
                totalTokens: parseInt(e.target.value) || 0,
              }))
            }
            required
          />
          <Input
            label="Used Tokens"
            type="number"
            min="0"
            max={tokenData.totalTokens}
            value={tokenData.usedTokens}
            onChange={(e) =>
              setTokenData((prev) => ({
                ...prev,
                usedTokens: parseInt(e.target.value) || 0,
              }))
            }
            required
          />
          <div className="text-sm text-gray-600">
            Remaining tokens: {tokenData.totalTokens - tokenData.usedTokens}
          </div>
        </form>
      </Modal>

      {/* Print Token Modal */}
      <Modal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        title="Print Tokens"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowPrintModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePrintTokens}
              loading={printing}
              disabled={tokenSystem?.remainingTokens < printQuantity}
            >
              Print {printQuantity} Token{printQuantity > 1 ? "s" : ""}
            </Button>
          </>
        }
      >
        <form onSubmit={handlePrintTokens} className="space-y-4">
          <Input
            label="Quantity"
            type="number"
            min="1"
            max={Math.min(10, tokenSystem?.remainingTokens || 0)}
            value={printQuantity}
            onChange={(e) => setPrintQuantity(parseInt(e.target.value) || 1)}
            required
          />
          <div className="text-sm text-gray-600">
            Available tokens: {tokenSystem?.remainingTokens || 0}
          </div>
          {tokenSystem?.remainingTokens < printQuantity && (
            <div className="text-sm text-red-600">
              Not enough tokens remaining
            </div>
          )}
        </form>
      </Modal>
    </Layout>
  );
};

export default Dashboard;
