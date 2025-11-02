import React, { useEffect, useState } from "react";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import api from "../config/api";
import {
  FiUsers,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiActivity,
  FiTarget,
} from "react-icons/fi";

const Statistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get("/token/statistics");
      setStatistics(response.data.statistics);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading statistics..." />
        </div>
      </Layout>
    );
  }

  const todayStats =
    statistics?.today?.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}) || {};

  const totalStats =
    statistics?.total?.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}) || {};

  const systemStats = statistics?.system || {};

  return (
    <Layout>
      <div className="space-y-8">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBarChart2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Statistics & Analytics
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-time insights into your token system performance
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Data</span>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Statistics */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <FiActivity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              Today's Activity
            </h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Total Printed
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {(todayStats.pending || 0) +
                      (todayStats.completed || 0) +
                      (todayStats.cancelled || 0)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Today</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 hover:border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Pending
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.pending || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">In queue</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 hover:border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Completed
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.completed || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Successful</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200 hover:border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Cancelled
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.cancelled || 0}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Cancelled</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <FiXCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* All-Time Statistics */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <FiTrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              All-Time Statistics
            </h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-purple-700 mb-1">
                    Total Printed
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {(totalStats.pending || 0) +
                      (totalStats.completed || 0) +
                      (totalStats.cancelled || 0)}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">All time</div>
                </div>
                <div className="p-3 bg-purple-200 rounded-lg">
                  <FiTrendingUp className="w-6 h-6 text-purple-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-yellow-700 mb-1">
                    Total Pending
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {totalStats.pending || 0}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Historical</div>
                </div>
                <div className="p-3 bg-yellow-200 rounded-lg">
                  <FiClock className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-700 mb-1">
                    Total Completed
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {totalStats.completed || 0}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Success rate
                  </div>
                </div>
                <div className="p-3 bg-green-200 rounded-lg">
                  <FiCheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-red-700 mb-1">
                    Total Cancelled
                  </div>
                  <div className="text-2xl font-bold text-red-900">
                    {totalStats.cancelled || 0}
                  </div>
                  <div className="text-xs text-red-600 mt-1">Cancelled</div>
                </div>
                <div className="p-3 bg-red-200 rounded-lg">
                  <FiXCircle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <FiTarget className="w-5 h-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              System Overview
            </h2>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
            {/* Token Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiTarget className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-700 mb-1">
                  {systemStats.totalTokens || 0}
                </div>
                <div className="text-sm font-medium text-blue-600">
                  Total Tokens Set
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  System capacity
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-700 mb-1">
                  {systemStats.usedTokens || 0}
                </div>
                <div className="text-sm font-medium text-green-600">
                  Tokens Used
                </div>
                <div className="text-xs text-gray-500 mt-1">Processed</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiClock className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-700 mb-1">
                  {systemStats.remainingTokens || 0}
                </div>
                <div className="text-sm font-medium text-orange-600">
                  Tokens Remaining
                </div>
                <div className="text-xs text-gray-500 mt-1">Available</div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-gray-800">
                  System Progress
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-indigo-600">
                    {systemStats.totalTokens
                      ? Math.round(
                          (systemStats.usedTokens / systemStats.totalTokens) *
                            100
                        )
                      : 0}
                    %
                  </span>
                  <span className="text-sm text-gray-500">Complete</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-sm"
                    style={{
                      width: `${
                        systemStats.totalTokens
                          ? (systemStats.usedTokens / systemStats.totalTokens) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>{systemStats.totalTokens || 0} tokens</span>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>System Active</span>
                </div>
                <div className="text-gray-500">
                  Last updated:{" "}
                  <span className="font-medium text-gray-700">
                    {systemStats.updatedAt
                      ? new Date(systemStats.updatedAt).toLocaleString()
                      : "Never"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Statistics;
