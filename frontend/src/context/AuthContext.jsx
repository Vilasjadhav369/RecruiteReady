import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  getToken,
  setToken,
  removeToken,
  loginUser,
  registerUser,
  googleLoginUser,
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
    } catch {
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

  // The API layer fires this when the server rejects the session (401),
  // so protected routes redirect to /login instead of showing broken pages.
  useEffect(() => {
    const handleExpired = () => {
      removeToken();
      setUser(null);
    };
    window.addEventListener("auth:expired", handleExpired);
    return () => window.removeEventListener("auth:expired", handleExpired);
  }, []);

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

  // Google Login handler
  const googleLogin = async (credential) => {
    const res = await googleLoginUser(credential);
    const userObj = res.data?.user;
    setUser(userObj);
    return res;
  };

  // Direct token login handler (for OAuth redirect flows like GitHub)
  const loginWithToken = async (token) => {
    setToken(token);
    const userData = await getCurrentUser();
    setUser(userData);
    return userData;
  };

  // Immediate in-memory user update (e.g. after profile edit)
  const updateUser = (updatedUserData) => {
    setUser((prev) => (prev ? { ...prev, ...updatedUserData } : updatedUserData));
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutUser();
    } finally {
      // Always clear local state, even if the network call fails.
      removeToken();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "admin",
      login,
      register,
      googleLogin,
      loginWithToken,
      updateUser,
      logout,
      refreshUser,
    }),
    // login/register/googleLogin/loginWithToken/updateUser/logout only touch stable setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, refreshUser]
  );

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
