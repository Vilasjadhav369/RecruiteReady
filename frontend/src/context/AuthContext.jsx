import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getToken,
  setToken,
  removeToken,
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and restore user from token on startup
  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.warn("Session expired or token invalid. Clearing auth state.");
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Login handler
  const login = async (credentials) => {
    const res = await loginUser(credentials);
    const userData = res.data?.user;
    setUser(userData);
    return res;
  };

  // Register handler
  const register = async (userData) => {
    const res = await registerUser(userData);
    const userObj = res.data?.user;
    setUser(userObj);
    return res;
  };

  // Immediate in-memory user update (e.g. after profile edit)
  const updateUser = (updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  };

  // Logout handler
  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    login,
    register,
    updateUser,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
