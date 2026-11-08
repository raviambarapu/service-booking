
import { createContext, useContext, useState } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // LOGIN
  const login = async (email, password) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      if (!data.access_token) {
        throw new Error("Access token was not received from the server.");
      }

      // Save JWT token
      localStorage.setItem("token", data.access_token);

      // Get user information
      let loggedInUser = data.user;

      if (!loggedInUser) {
        const response = await api.get("/auth/me");
        loggedInUser = response.data;
      }

      if (!loggedInUser) {
        throw new Error("User information was not received.");
      }

      // Save user information
      localStorage.setItem("user", JSON.stringify(loggedInUser));

      setUser(loggedInUser);

      return loggedInUser;
    } catch (error) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const register = async (name, email, password) => {
    await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return login(email, password);
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        isAuthenticated: Boolean(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
