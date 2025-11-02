import React, { useEffect, useState, useCallback } from "react";
import { useToken } from "../hooks/useAuth";
import Layout from "../components/layout/Layout";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import socketService from "../config/socket";
import {
  getTokenStatusColor,
  getTokenStatusText,
  formatDate,
} from "../utils/helpers";
import { FiRefreshCw, FiEdit, FiEye, FiPrinter } from "react-icons/fi";

const Tokens = () => {
  const { tokens, loading, loadTokens, updateTokenStatus, reprintToken } = useToken();
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [printingTokenId, setPrintingTokenId] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);

  const fetchTokens = useCallback(
    async (page = 1) => {
      const result = await loadTokens(page, 20);
      if (result.success) {
        setPagination(result.pagination);
        setCurrentPage(page);
      }
    },
    [loadTokens]
  );

  useEffect(() => {
    fetchTokens(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount to prevent infinite loop

  // Add socket listeners for real-time updates
  useEffect(() => {
    const socket = socketService.connect();

    // Listen for new tokens printed - refresh the current page
    socket.on("newTokensPrinted", (newTokens) => {
      console.log("New tokens printed, refreshing token list:", newTokens);
      fetchTokens(currentPage);
    });

    // Listen for token status updates - refresh the current page
    socket.on("tokenStatusUpdate", (updatedToken) => {
      console.log("Token status updated, refreshing token list:", updatedToken);
      fetchTokens(currentPage);
    });

    // Listen for token system updates
    socket.on("tokenSystemUpdate", (data) => {
      console.log("Token system updated:", data);
      // No need to refresh here as it's just system stats
    });

    return () => {
      socket.off("newTokensPrinted");
      socket.off("tokenStatusUpdate");
      socket.off("tokenSystemUpdate");
    };
  }, [currentPage, fetchTokens]);

  const handleStatusChange = async (tokenId, newStatus) => {
    await updateTokenStatus(tokenId, newStatus);
  };

  const handlePrintToken = async (tokenId) => {
    setPrintingTokenId(tokenId);
    await reprintToken(tokenId);
    setPrintingTokenId(null);
  };

  const handleViewToken = (token) => {
    setSelectedToken(token);
    setShowViewModal(true);
  };

  const handleRefresh = () => {
    fetchTokens(currentPage);
  };

  const handlePageChange = (page) => {
    fetchTokens(page);
  };

  if (loading && !tokens.length) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" text="Loading tokens..." />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Token Management</h1>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center"
          >
            <FiRefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        {/* Tokens Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Token #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tokens.map((token) => (
                  <tr key={token._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-gray-900">
                        #{token.tokenNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTokenStatusColor(
                          token.status
                        )}`}
                      >
                        {getTokenStatusText(token.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(token.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.createdBy?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {token.completedAt ? formatDate(token.completedAt) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintToken(token._id)}
                        disabled={printingTokenId === token._id}
                        loading={printingTokenId === token._id}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FiPrinter className="mr-1 h-3 w-3" />
                        {printingTokenId === token._id ? "Printing..." : "Print"}
                      </Button>
                      {token.status === "pending" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() =>
                            handleStatusChange(token._id, "completed")
                          }
                        >
                          <FiEdit className="mr-1 h-3 w-3" />
                          Complete
                        </Button>
                      )}
                      {token.status === "pending" && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            handleStatusChange(token._id, "cancelled")
                          }
                        >
                          <FiEdit className="mr-1 h-3 w-3" />
                          Cancel
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleViewToken(token)}
                      >
                        <FiEye className="mr-1 h-3 w-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of{" "}
                  {pagination.totalPages} ({pagination.totalTokens} total tokens)
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}

          {tokens.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No tokens found</div>
              <p className="text-gray-400 mt-2">
                Start by printing your first token!
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* View Token Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={`Token Details - #${selectedToken?.tokenNumber || ''}`}
        footer={
          <Button variant="outline" onClick={() => setShowViewModal(false)}>
            Close
          </Button>
        }
      >
        {selectedToken && (
          <div className="space-y-6">
            {/* Token Header */}
            <div className="text-center pb-4 border-b border-gray-200">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                Token #{selectedToken.tokenNumber}
              </div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getTokenStatusColor(
                  selectedToken.status
                )}`}
              >
                {getTokenStatusText(selectedToken.status)}
              </span>
            </div>

            {/* Token Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Basic Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Token Number:</span>
                    <div className="text-lg font-bold text-gray-900">#{selectedToken.tokenNumber}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <div className="mt-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTokenStatusColor(
                          selectedToken.status
                        )}`}
                      >
                        {getTokenStatusText(selectedToken.status)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Created Date:</span>
                    <div className="text-sm text-gray-900">{formatDate(selectedToken.createdAt)}</div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Created By:</span>
                    <div className="text-sm text-gray-900">{selectedToken.createdBy?.name || "Unknown"}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Status Information
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Completed Date:</span>
                    <div className="text-sm text-gray-900">
                      {selectedToken.completedAt ? formatDate(selectedToken.completedAt) : "Not completed"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Cancelled Date:</span>
                    <div className="text-sm text-gray-900">
                      {selectedToken.cancelledAt ? formatDate(selectedToken.cancelledAt) : "Not cancelled"}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Last Updated:</span>
                    <div className="text-sm text-gray-900">{formatDate(selectedToken.updatedAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata Section */}
            {selectedToken.metadata && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                  Additional Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedToken.metadata.printedAt && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Printed At:</span>
                        <div className="text-sm text-gray-900">
                          {formatDate(selectedToken.metadata.printedAt)}
                        </div>
                      </div>
                    )}
                    {selectedToken.metadata.printedBy && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Printed By:</span>
                        <div className="text-sm text-gray-900">{selectedToken.metadata.printedBy}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions Section */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                Actions
              </h4>
              <div className="flex space-x-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handlePrintToken(selectedToken._id);
                    setShowViewModal(false);
                  }}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <FiPrinter className="mr-1 h-3 w-3" />
                  Print Token
                </Button>
                
                {selectedToken.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        handleStatusChange(selectedToken._id, "completed");
                        setShowViewModal(false);
                      }}
                    >
                      <FiEdit className="mr-1 h-3 w-3" />
                      Mark as Completed
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        handleStatusChange(selectedToken._id, "cancelled");
                        setShowViewModal(false);
                      }}
                    >
                      <FiEdit className="mr-1 h-3 w-3" />
                      Cancel Token
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
};

export default Tokens;