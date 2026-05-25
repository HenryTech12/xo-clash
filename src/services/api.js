import axios from "axios";

const API_URL = `${
    import.meta.env.VITE_API_URL || "https://xo-clash-8ysf.onrender.com"
}/api/v1`;

const api = axios.create({
    baseURL: API_URL,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem("refreshToken");

            if (!refreshToken) {
                isRefreshing = false;
                processQueue(new Error("No refresh token"), null);
                // Auth failure - clear session
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            return new Promise(function (resolve, reject) {
                axios
                    .get(`${API_URL}/auth/refresh`, {
                        headers: {
                            Authorization: `Bearer ${refreshToken}`,
                        },
                    })
                    .then(({ data }) => {
                        if (data && data.accessToken) {
                            const newToken = data.accessToken;
                            const returnedRefreshToken =
                                data.refreshToken || refreshToken;

                            localStorage.setItem("token", newToken);
                            localStorage.setItem(
                                "refreshToken",
                                returnedRefreshToken
                            );

                            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;

                            processQueue(null, newToken);
                            resolve(api(originalRequest));
                        } else {
                            throw new Error("Invalid response from refresh");
                        }
                    })
                    .catch((err) => {
                        processQueue(err, null);
                        // Clear session on refresh failure
                        localStorage.removeItem("token");
                        localStorage.removeItem("refreshToken");
                        localStorage.removeItem("user");
                        if (window.location.pathname !== "/login") {
                            window.location.href = "/login";
                        }
                        reject(err);
                    })
                    .finally(() => {
                        isRefreshing = false;
                    });
            });
        }

        return Promise.reject(error);
    }
);

export const authService = {
    login: async (credentials) => {
        const response = await api.post("/auth/login", credentials);
        return response.data;
    },
    signup: async (userData) => {
        const response = await api.post("/auth/create-account", userData);
        return response.data;
    },
    validateToken: async () => {
        const response = await api.get("/auth/validate/token");
        return response.data;
    },
};

export const gameService = {
    join: async () => {
        const response = await api.get("/game/join");
        return response.data;
    },
    makeMove: async (moveData) => {
        const response = await api.post("/game/move", moveData);
        return response.data;
    },
    usePowerUp: async (powerUpData) => {
        // powerUpData expected: { sessionId, playerId, powerUpType, targetRow, targetCol }
        const response = await api.post("/game/powerup/activate", powerUpData);
        return response.data;
    },
    leave: async (leaveData) => {
        const response = await api.post("/game/leave", leaveData);
        return response.data;
    },
    endGame: async (sessionId) => {
        const response = await api.post("/game/end", { sessionId });
        return response.data;
    },
    requestPlayAgain: async (sessionId, requesterUsername) => {
        const response = await api.post("/game/play-again/request", {
            sessionId,
            requesterUsername,
        });
        return response.data;
    },
    acceptPlayAgain: async (sessionId, acceptorUsername) => {
        const response = await api.post("/game/play-again/accept", {
            sessionId,
            acceptorUsername,
        });
        return response.data;
    },
    rejectPlayAgain: async (sessionId, rejectorUsername) => {
        const response = await api.post("/game/play-again/reject", {
            sessionId,
            rejectorUsername,
        });
        return response.data;
    },
    trackResult: async (resultData) => {
        // Using WebSockets now, so this is just a fallback log
        console.log("Game tracked via WebSocket instead", resultData);
        return { success: true };
    },
};

export const trackService = {
    getDashboardData: async (playerId) => {
        const response = await api.get(`/track/dashboard?playerId=${playerId}`);
        return response.data;
    },
    getResultById: async (id) => {
        const response = await api.get(`/track/result/${id}`);
        return response.data;
    },
};

export const powerUpService = {
    initPlayerPowerUps: async () => {
        return api.get("/powerups/init");
    },
    getAvailablePowerUps: async () => {
        try {
            const response = await api.get("/powerups/available");
            return response.data.powerups || response.data;
        } catch (error) {
            console.error("API error fetching powerups:", error);
            // Return empty array or handle as needed, Dashboard has its own fallback
            throw error;
        }
    },
    getPlayerPowerUps: async (username) => {
        const response = await api.get(`/players/${username}/powerups`);
        return response.data;
    },
    getPlayerStats: async (username) => {
        const response = await api.get(`/players/${username}/stats`);
        return response.data;
    },
    activatePowerUp: async (powerUpData) => {
        // powerUpData: { powerUpType, playerId, sessionId?, targetRow?, targetCol? }
        const response = await api.post("/powerups/activate", powerUpData);
        return response.data;
    },
    getRankings: async (limit = 50) => {
        const response = await api.get(`/players/rankings?limit=${limit}`);
        return response.data;
    },
};

export default api;
