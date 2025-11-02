import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import api from "../config/api";
import socketService from "../config/socket";
import toast from "react-hot-toast";

// Initial state
const initialState = {
  tokenSystem: {
    totalTokens: 0,
    usedTokens: 0,
    remainingTokens: 0,
    currentTokenNumber: 0,
  },
  tokens: [],
  loading: false,
  error: null,
  printing: false,
};

// Actions
const TokenActions = {
  LOADING: "LOADING",
  SET_TOKEN_SYSTEM: "SET_TOKEN_SYSTEM",
  SET_TOKENS: "SET_TOKENS",
  ADD_TOKEN: "ADD_TOKEN",
  UPDATE_TOKEN: "UPDATE_TOKEN",
  SET_PRINTING: "SET_PRINTING",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Reducer
const tokenReducer = (state, action) => {
  switch (action.type) {
    case TokenActions.LOADING:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case TokenActions.SET_TOKEN_SYSTEM:
      return {
        ...state,
        tokenSystem: action.payload,
        loading: false,
        error: null,
      };

    case TokenActions.SET_TOKENS:
      return {
        ...state,
        tokens: action.payload,
        loading: false,
        error: null,
      };

    case TokenActions.ADD_TOKEN:
      return {
        ...state,
        tokens: [action.payload, ...state.tokens],
      };

    case TokenActions.UPDATE_TOKEN:
      return {
        ...state,
        tokens: state.tokens.map((token) =>
          token._id === action.payload._id ? action.payload : token
        ),
      };

    case TokenActions.SET_PRINTING:
      return {
        ...state,
        printing: action.payload,
      };

    case TokenActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        printing: false,
      };

    case TokenActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const TokenContext = createContext();

// Provider component
export const TokenProvider = ({ children }) => {
  const [state, dispatch] = useReducer(tokenReducer, initialState);

  // Initialize socket listeners
  useEffect(() => {
    const socket = socketService.connect();

    // Listen for token system updates
    socket.on("tokenSystemUpdate", (tokenSystem) => {
      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: tokenSystem,
      });
    });

    // Listen for new tokens printed
    socket.on("newTokensPrinted", (tokens) => {
      tokens.forEach((token) => {
        dispatch({
          type: TokenActions.ADD_TOKEN,
          payload: token,
        });
      });
    });

    // Listen for token status updates
    socket.on("tokenStatusUpdate", (token) => {
      dispatch({
        type: TokenActions.UPDATE_TOKEN,
        payload: token,
      });
    });

    // Listen for token system reset
    socket.on("tokenSystemReset", (tokenSystem) => {
      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: tokenSystem,
      });
      dispatch({
        type: TokenActions.SET_TOKENS,
        payload: [],
      });
      toast.success("Token system has been reset");
    });

    return () => {
      socket.off("tokenSystemUpdate");
      socket.off("newTokensPrinted");
      socket.off("tokenStatusUpdate");
      socket.off("tokenSystemReset");
    };
  }, []);

  // Load token system status
  const loadTokenSystem = useCallback(async () => {
    try {
      dispatch({ type: TokenActions.LOADING });
      const response = await api.get("/token/system/status");

      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: response.data.tokenSystem,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to load token system";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update token system
  const updateTokenSystem = useCallback(async (totalTokens, usedTokens) => {
    try {
      dispatch({ type: TokenActions.LOADING });
      const response = await api.put("/token/system/update", {
        totalTokens,
        usedTokens,
      });

      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: response.data.tokenSystem,
      });

      toast.success("Token system updated successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update token system";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Print token
  const printToken = useCallback(async (quantity = 1) => {
    try {
      dispatch({ type: TokenActions.SET_PRINTING, payload: true });
      const response = await api.post("/token/print", { quantity });

      // Update token system
      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: response.data.tokenSystem,
      });

      // Add printed tokens
      response.data.tokens.forEach((token) => {
        dispatch({
          type: TokenActions.ADD_TOKEN,
          payload: token,
        });
      });

      dispatch({ type: TokenActions.SET_PRINTING, payload: false });

      // Show detailed print results
      const successCount = response.data.printResults.filter(
        (r) => r.success
      ).length;
      const printStatus = response.data.printStatus;

      if (printStatus === 'success') {
        toast.success(`✅ ${response.data.message}`);
      } else if (printStatus === 'failed') {
        toast.error(`❌ ${response.data.message}`);
        
        // Show specific printer errors
        const failedResults = response.data.printResults.filter(r => !r.success);
        failedResults.forEach((result, index) => {
          setTimeout(() => {
            toast.error(`Token #${result.tokenNumber}: ${result.error}`, {
              duration: 6000,
            });
          }, (index + 1) * 1000);
        });
      } else if (printStatus === 'partial') {
        toast.warning(`⚠️ ${response.data.message}`);
        
        // Show specific errors for failed prints
        const failedResults = response.data.printResults.filter(r => !r.success);
        failedResults.forEach((result, index) => {
          setTimeout(() => {
            toast.error(`Token #${result.tokenNumber}: ${result.error}`, {
              duration: 6000,
            });
          }, (index + 1) * 2000);
        });
      }

      return { 
        success: true, 
        printResults: response.data.printResults,
        printStatus: response.data.printStatus,
        successCount: response.data.successCount,
        failCount: response.data.failCount
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to print token";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      dispatch({ type: TokenActions.SET_PRINTING, payload: false });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Load tokens
  const loadTokens = useCallback(async (page = 1, limit = 20) => {
    try {
      dispatch({ type: TokenActions.LOADING });
      const response = await api.get(`/token/all?page=${page}&limit=${limit}`);

      dispatch({
        type: TokenActions.SET_TOKENS,
        payload: response.data.tokens,
      });

      return {
        success: true,
        tokens: response.data.tokens,
        pagination: response.data.pagination,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to load tokens";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, []);

  // Update token status
  const updateTokenStatus = useCallback(async (tokenId, status) => {
    try {
      const response = await api.put(`/token/status/${tokenId}`, { status });

      dispatch({
        type: TokenActions.UPDATE_TOKEN,
        payload: response.data.token,
      });

      toast.success("Token status updated");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update token status";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Reset token system
  const resetTokenSystem = useCallback(async () => {
    try {
      dispatch({ type: TokenActions.LOADING });
      const response = await api.post("/token/system/reset");

      dispatch({
        type: TokenActions.SET_TOKEN_SYSTEM,
        payload: response.data.tokenSystem,
      });

      dispatch({
        type: TokenActions.SET_TOKENS,
        payload: [],
      });

      toast.success("Token system reset successfully");
      return { success: true };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reset token system";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Reprint individual token
  const reprintToken = useCallback(async (tokenId) => {
    try {
      dispatch({ type: TokenActions.SET_PRINTING, payload: true });
      const response = await api.post(`/token/reprint/${tokenId}`);

      dispatch({ type: TokenActions.SET_PRINTING, payload: false });

      if (response.data.printResult.success) {
        toast.success(`✅ ${response.data.message}`);
      } else {
        toast.error(`❌ ${response.data.message}`);
      }

      return { 
        success: response.data.success, 
        printResult: response.data.printResult 
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to reprint token";
      dispatch({
        type: TokenActions.SET_ERROR,
        payload: errorMessage,
      });
      dispatch({ type: TokenActions.SET_PRINTING, payload: false });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: TokenActions.CLEAR_ERROR });
  }, []);

  const value = {
    tokenSystem: state.tokenSystem,
    tokens: state.tokens,
    loading: state.loading,
    error: state.error,
    printing: state.printing,
    loadTokenSystem,
    updateTokenSystem,
    printToken,
    reprintToken,
    loadTokens,
    updateTokenStatus,
    resetTokenSystem,
    clearError,
  };

  return (
    <TokenContext.Provider value={value}>{children}</TokenContext.Provider>
  );
};

export { TokenContext };
