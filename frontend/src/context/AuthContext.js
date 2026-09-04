import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("bmn_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      localStorage.setItem("bmn_user", JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("bmn_token");
    if (token) {
      refreshUser().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("bmn_token", data.access_token);
    localStorage.setItem("bmn_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("bmn_token");
    localStorage.removeItem("bmn_user");
    setUser(null);
    window.location.href = "/login";
  };

  const can = (perm) => user?.permissions?.includes(perm);
  const canAny = (...perms) => perms.some((p) => user?.permissions?.includes(p));

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, refreshUser, can, canAny }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
