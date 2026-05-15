import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { authService, powerUpService } from "../services/api";

const AuthContext = createContext(null);

// Helper function to decode JWT and check expiration
const isTokenExpired = (token) => {
    if (!token || typeof token !== "string") {
        console.warn("isTokenExpired received non-string token:", typeof token);
        return true;
    }
    const parts = token.split(".");
    if (parts.length !== 3) {
        console.error("Invalid token format (expected 3 parts):", token);
        return true;
    }
    try {
        const payload = JSON.parse(atob(parts[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        return Date.now() >= expirationTime;
    } catch (e) {
        console.error("Failed to decode token payload:", e);
        return true;
    }
};

// Function to refresh access token using refresh token
const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
        throw new Error("No refresh token available");
    }

    try {
        const response = await axios.get(
            `https://xo-clash-tad8.onrender.com/api/v1/auth/refresh`,
            {
                headers: {
                    Authorization: `Bearer ${refreshToken}`,
                },
            }
        );

        if (response.data && response.data.accessToken) {
            localStorage.setItem("token", response.data.accessToken);
            if (response.data.refreshToken) {
                localStorage.setItem(
                    "refreshToken",
                    response.data.refreshToken
                );
            }
            return response.data;
        }
        throw new Error("No access token in refresh response");
    } catch (error) {
        console.error("Failed to refresh token:", error);
        // Clear auth data on refresh failure
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        throw error;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const savedUser = localStorage.getItem("user");
                const token = localStorage.getItem("token");

                if (savedUser && token) {
                    try {
                        // First, validate token with backend API
                        console.log("Validating token with backend...");
                        await authService.validateToken();
                        // Token is valid
                        setUser(JSON.parse(savedUser));
                    } catch (err) {
                        console.log(
                            "Token validation failed, attempting refresh..."
                        );
                        // If validation fails (including 401), try to refresh
                        try {
                            const refreshData = await refreshAccessToken();
                            if (refreshData && refreshData.accessToken) {
                                setUser(JSON.parse(savedUser));
                            } else {
                                logout();
                            }
                        } catch (refreshError) {
                            console.error(
                                "Token refresh failed during init:",
                                refreshError
                            );
                            logout();
                        }
                    }
                } else {
                    // No session found
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                logout();
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = (userData, token, refreshToken) => {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", token);
        if (refreshToken) {
            localStorage.setItem("refreshToken", refreshToken);
        }
        setUser(userData);

        // Asynchronously initialize power-ups for the player without blocking
        powerUpService.initPlayerPowerUps().catch((err) => {
            console.warn("Failed to initialize player power-ups:", err);
        });
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                isAuthenticated: !!user,
                loading,
                isTokenExpired,
                refreshAccessToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
