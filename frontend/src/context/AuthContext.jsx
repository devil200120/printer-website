import React, { createContext, useReducer, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../config/api";

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Actions
const AuthActions = {
  LOADING: "LOADING",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  LOAD_USER_SUCCESS: "LOAD_USER_SUCCESS",
  SET_ERROR: "SET_ERROR",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActions.LOADING:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case AuthActions.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AuthActions.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case AuthActions.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case AuthActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case AuthActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    loadUser();
  }, []);

  // Load user from token
  const loadUser = async () => {
    const token = Cookies.get("token");
    if (token) {
      try {
        dispatch({ type: AuthActions.LOADING });
        const response = await api.get("/user/getuser");

        dispatch({
          type: AuthActions.LOAD_USER_SUCCESS,
          payload: {
            user: response.data.user,
          },
        });
      } catch (error) {
        console.error("Failed to load user:", error);
        Cookies.remove("token");
        dispatch({ type: AuthActions.LOGOUT });
      }
    } else {
      dispatch({ type: AuthActions.LOGOUT });
    }
  };

  // Login
  const login = async (email, password) => {
    try {
      dispatch({ type: AuthActions.LOADING });
      const response = await api.post("/user/login-user", { email, password });

      const { user, token } = response.data;

      // Store token in cookie
      Cookies.set("token", token, { expires: 7 });

      dispatch({
        type: AuthActions.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true, user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      dispatch({
        type: AuthActions.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      dispatch({ type: AuthActions.LOADING });
      const response = await api.post("/user/create-user", userData);

      dispatch({ type: AuthActions.LOGOUT });

      return {
        success: true,
        message: response.data.message,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      dispatch({
        type: AuthActions.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await api.get("/user/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      Cookies.remove("token");
      dispatch({ type: AuthActions.LOGOUT });
    }
  };

  // Update user info
  const updateUserInfo = async (userData) => {
    try {
      dispatch({ type: AuthActions.LOADING });
      const response = await api.put("/user/update-user-info", userData);

      dispatch({
        type: AuthActions.LOAD_USER_SUCCESS,
        payload: {
          user: response.data.user,
        },
      });

      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Update failed";
      dispatch({
        type: AuthActions.SET_ERROR,
        payload: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AuthActions.CLEAR_ERROR });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateUserInfo,
    loadUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
