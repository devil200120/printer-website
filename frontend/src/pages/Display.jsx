import React, { useEffect, useState } from "react";
import { useToken } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import socketService from "../config/socket";
import { getCurrentDateTime } from "../utils/helpers";
import { FiUsers, FiActivity, FiClock, FiArrowLeft } from "react-icons/fi";

const Display = () => {
  const { tokenSystem, loadTokenSystem } = useToken();
  const [currentTime, setCurrentTime] = useState(getCurrentDateTime());
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial token system data
    loadTokenSystem();

    // Connect to socket and join display room for real-time updates
    socketService.connect();
    socketService.joinDisplay();

    // Listen for real-time token system updates
    socketService.on("tokenSystemUpdate", (data) => {
      console.log("Received token system update:", data);
      // Force reload of token system data
      loadTokenSystem();
    });

    // Listen for new tokens being printed
    socketService.on("newTokensPrinted", (tokens) => {
      console.log("New tokens printed:", tokens);
      // Force reload to update display
      loadTokenSystem();
    });

    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(getCurrentDateTime());
    }, 1000);

    // Cleanup
    return () => {
      clearInterval(timeInterval);
      socketService.off("tokenSystemUpdate");
      socketService.off("newTokensPrinted");
      socketService.leaveDisplay();
    };
  }, [loadTokenSystem]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Subtle Back Button */}
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 group"
                title="Back to Dashboard"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Token Management System
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live Display Board
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-medium text-gray-900">
                {currentTime.time}
              </div>
              <div className="text-xs text-gray-500">{currentTime.date}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Current Token - Hero Section */}
        <div className="text-center mb-8">
          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <p className="text-gray-600 text-sm mb-3 font-medium">
              Now Serving
            </p>
            <div className="text-5xl md:text-6xl font-bold text-blue-600 mb-3">
              #{tokenSystem?.currentTokenNumber || 0}
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
              Active
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Tokens */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Total Tokens
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tokenSystem?.totalTokens || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiUsers className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Used Tokens */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Used Tokens
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tokenSystem?.usedTokens || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-green-600 font-medium">
                {tokenSystem?.totalTokens
                  ? `${Math.round(
                      (tokenSystem.usedTokens / tokenSystem.totalTokens) * 100
                    )}% Complete`
                  : "0% Complete"}
              </span>
            </div>
          </div>

          {/* Remaining Tokens */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs font-medium mb-1">
                  Remaining
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {tokenSystem?.remainingTokens || 0}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FiClock className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs text-orange-600 font-medium">
                Available Now
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Progress Overview
            </h2>
            <span className="text-xl font-bold text-blue-600">
              {tokenSystem?.totalTokens
                ? `${Math.round(
                    (tokenSystem.usedTokens / tokenSystem.totalTokens) * 100
                  )}%`
                : "0%"}
            </span>
          </div>

          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 bg-blue-600 rounded-full transition-all duration-700"
                style={{
                  width: `${
                    tokenSystem?.totalTokens
                      ? (tokenSystem.usedTokens / tokenSystem.totalTokens) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0</span>
              <span>
                {tokenSystem?.usedTokens || 0} of{" "}
                {tokenSystem?.totalTokens || 0} tokens used
              </span>
              <span>{tokenSystem?.totalTokens || 0}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                <span>System Online</span>
              </div>
              <span>
                Last Updated:{" "}
                {tokenSystem?.updatedAt
                  ? new Date(tokenSystem.updatedAt).toLocaleTimeString()
                  : "Never"}
              </span>
            </div>
            <div>© 2025 Token Management System</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Display;
