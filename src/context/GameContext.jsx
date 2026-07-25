import { useState, useEffect, useMemo, useRef } from "react";
import webSocketService from "../services/websocket";
import { gameService, trackService } from "../services/api";
import { useAuth } from "./AuthContext";
import {
    GameContext,
    MatchmakingContext,
    PowerUpContext,
} from "./GameContextInstance";
import toast from "react-hot-toast";

// Helper to check for a winner locally in case the backend checking misses it
const checkWinnerLocal = (board) => {
    if (!board || board.length !== 3) return null;
    const lines = [
        // rows
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        // cols
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        // diagonals
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]],
    ];
    for (let line of lines) {
        if (line[0] && line[0] === line[1] && line[1] === line[2]) {
            return line[0]; // returns 'X' or 'O'
        }
    }
    return null;
};

const checkDrawLocal = (board) => {
    if (!board) return false;
    return !board.flat().includes("") && !board.flat().includes(null);
};

// Anchor persisted across refreshes so a reload mid-match can attempt to
// rejoin the still-live session instead of silently falling back to the
// Dashboard. Only {sessionId, username} is stored — the board itself is
// always re-fetched from the server via gameService.join().
const SESSION_ANCHOR_KEY = "xo-clash-active-session";

const readSessionAnchor = () => {
    try {
        const raw = sessionStorage.getItem(SESSION_ANCHOR_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

const writeSessionAnchor = (sessionId, username) => {
    try {
        sessionStorage.setItem(
            SESSION_ANCHOR_KEY,
            JSON.stringify({ sessionId, username })
        );
    } catch {
        // sessionStorage unavailable (private mode, etc.) - reconnect-on-refresh
        // just won't be available; the rest of the app is unaffected.
    }
};

const clearSessionAnchor = () => {
    try {
        sessionStorage.removeItem(SESSION_ANCHOR_KEY);
    } catch {
        // ignore
    }
};

export const GameProvider = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const [gameState, setGameState] = useState(null);
    const [matchmaking, setMatchmaking] = useState(false);
    const [connected, setConnected] = useState(false);
    // True while we're checking a stale session anchor against the server on
    // mount, so GameSwitch can show a "Reconnecting" state instead of
    // flashing the Dashboard before falling back (or restoring the match).
    const [reconnecting, setReconnecting] = useState(() => !!readSessionAnchor());
    const [notifications, setNotifications] = useState([]);
    const [playAgainRequest, setPlayAgainRequest] = useState(null); // null, 'requested', 'pending', 'accepted', 'rejected'
    const [playAgainFrom, setPlayAgainFrom] = useState(null); // username of the player requesting play again

    // Power up State
    // Real counts arrive from the player-powerups fetch below; starting
    // empty (rather than a fabricated default) avoids briefly showing
    // made-up quantities - or omitting power-ups entirely - before it resolves.
    const [availablePowerUps, setAvailablePowerUps] = useState([]);
    const [playerStats, setPlayerStats] = useState(null);
    const [activePowerUp, setActivePowerUp] = useState(null); // Power-up currently selected to be used

    const resetGame = () => {
        clearSessionAnchor();
        setGameState(null);
        setMatchmaking(false);
        setPlayAgainRequest(null);
        setPlayAgainFrom(null);
        setActivePowerUp(null);
    };

    // On mount, if a previous match left a session anchor behind (e.g. this
    // tab was refreshed mid-match), check whether the backend still has that
    // session alive - within its reconnect grace window - before falling
    // back to the Dashboard.
    const attemptedReconnectRef = useRef(false);
    useEffect(() => {
        if (!isAuthenticated || !user?.username) return;
        if (attemptedReconnectRef.current) return;
        attemptedReconnectRef.current = true;

        const anchor = readSessionAnchor();
        if (!anchor || anchor.username !== user.username) {
            clearSessionAnchor();
            setReconnecting(false);
            return;
        }

        (async () => {
            try {
                const state = await gameService.join();
                if (state && state.sessionId) {
                    setGameState({
                        ...state,
                        board: state.board || [
                            ["", "", ""],
                            ["", "", ""],
                            ["", "", ""],
                        ],
                    });
                } else {
                    // Grace window already elapsed, or the session genuinely
                    // ended - nothing to restore.
                    clearSessionAnchor();
                }
            } catch (error) {
                console.error("Failed to reconnect to previous session:", error);
                clearSessionAnchor();
            } finally {
                setReconnecting(false);
            }
        })();
    }, [isAuthenticated, user?.username]);

    // Keep the anchor in sync with the live session so a refresh always has
    // an up-to-date {sessionId, username} to reconnect against.
    useEffect(() => {
        if (!gameState?.sessionId || !user?.username) return;
        if (gameState.gameOver) {
            clearSessionAnchor();
        } else {
            writeSessionAnchor(gameState.sessionId, user.username);
        }
    }, [gameState?.sessionId, gameState?.gameOver, user?.username]);

    // Fetch user power-ups periodically or when authenticated
    useEffect(() => {
        if (user?.username) {
            // Fetch unlocked powerups with counts
            fetch(
                `${
                    import.meta.env.VITE_API_URL ||
                    "https://xo-clash-8ysf.onrender.com"
                }/api/v1/players/${user.username}/powerups`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            )
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    // Backend returns a raw array of PlayerPowerUps
                    // (type: powerupName, count); powerupId is per-player scoped
                    if (Array.isArray(data) && data.length > 0) {
                        setAvailablePowerUps(data);
                    } else if (data && Array.isArray(data.unlockedPowerups)) {
                        setAvailablePowerUps(data.unlockedPowerups);
                    }
                })
                .catch((err) => console.error("Error fetching powerups:", err));

            // Fetch player stats to get actual rank points
            trackService
                .getDashboardData(user.username)
                .then((data) => {
                    console.log("Player stats data received:", data);
                    if (data && data.dashboardData) {
                        setPlayerStats(data.dashboardData);
                    } else if (data) {
                        setPlayerStats(data);
                    }
                })
                .catch((err) =>
                    console.error("Error fetching player stats:", err)
                );
        }
    }, [user?.username]);

    useEffect(() => {
        if (isAuthenticated) {
            // Helper to fetch state when match found
            const handleMatchFound = async () => {
                try {
                    console.log("Fetching matching state...");
                    const state = await gameService.join();
                    console.log("Game state received:", state);

                    // Relaxed check: if board is missing, initialize a 3x3 board
                    if (state && state.players) {
                        const validatedState = {
                            ...state,
                            board: state.board || [
                                ["", "", ""],
                                ["", "", ""],
                                ["", "", ""],
                            ],
                        };
                        setGameState(validatedState);
                        setMatchmaking(false);
                    }
                } catch (error) {
                    console.error(
                        "Failed to fetch game state after match found:",
                        error
                    );
                }
            };

            webSocketService.connect(
                () => {
                    setConnected(true);

                    // Clear old subscriptions before re-subscribing (prevents duplicate toasts)
                    webSocketService.unsubscribeAll();

                    // Subscribe to user-specific matchmaking
                    webSocketService.subscribe(
                        `/topic/matchmaking/${user.username}`,
                        (msg) => {
                            console.log("Matchmaking msg:", msg);
                            const matchText =
                                typeof msg === "string" ? msg : msg?.text || "";

                            if (matchText) {
                                // Only show notification if we aren't already in a game with a stable sessionId
                                if (!gameState?.sessionId) {
                                    toast.success(matchText);
                                }
                            }

                            // Handle simple text "MATCH FOUND" or "MATCH_FOUND"
                            if (
                                (matchText.includes("MATCH FOUND") ||
                                    matchText.includes("MATCH_FOUND")) &&
                                !gameState?.sessionId // ONLY trigger if we don't already have a session
                            ) {
                                handleMatchFound();
                            }
                        }
                    );

                    // Note: Game-specific subscriptions (actions, notifications, and play-again)
                    // will be set up in a separate useEffect when a session starts

                    // Subscribe to user-specific notifications
                    webSocketService.subscribe(
                        `/topic/notifications/${user.username}`,
                        (msg) => {
                            if (typeof msg === "string") {
                                toast(msg, { icon: "🔔" });
                            }
                            setNotifications((prev) => [...prev, msg]);
                        }
                    );

                    // Subscribe to global notifications
                    webSocketService.subscribe(
                        "/topic/notifications",
                        (msg) => {
                            if (typeof msg === "string") {
                                toast(msg, { icon: "🔔" });
                            }
                            setNotifications((prev) => [...prev, msg]);
                        }
                    );
                },
                (err) => {
                    console.error("WS connection error", err);
                    setConnected(false);
                }
            );
        }

        // NO AUTOMATIC DISCONNECT on unmount to prevent loop during re-renders/navigation
        // Disconnect should be handled globally or during logout
    }, [isAuthenticated, user?.username]); // Removed gameState dependency to prevent re-sub on every move

    // Subscribe to game-session-specific actions and play-again requests
    useEffect(() => {
        if (gameState?.sessionId && user?.username) {
            console.log(
                "Setting up game-specific subscriptions for session:",
                gameState.sessionId
            );

            // Subscribe to game updates for this specific session
            const unsubscribeActions = webSocketService.subscribe(
                `/topic/actions/${gameState.sessionId}`,
                (msg) => {
                    console.log("Game action received:", msg);
                    if (!msg) return;

                    if (typeof msg === "string") {
                        if (msg.includes("SPACE_TAKEN")) {
                            toast.error(
                                "That space is already taken! Choose another box.",
                                { id: "space-taken" }
                            );
                            return;
                        }

                        if (msg.includes("GAME_ENDED")) {
                            setGameState((prev) =>
                                prev ? { ...prev, gameOver: true } : null
                            );
                            // Fetch the full state so the other player gets the winner and final board
                            setTimeout(async () => {
                                try {
                                    const state = await gameService.join();
                                    if (state) {
                                        setGameState((prev) => ({
                                            ...prev,
                                            ...state,
                                            gameOver: true,
                                        }));
                                    }
                                } catch (e) {
                                    console.error(
                                        "Failed to fetch final state",
                                        e
                                    );
                                }
                            }, 500);
                        }
                        if (msg.includes("PLAYER_LEFT")) {
                            toast.error("Opponent left the game", {
                                icon: "❌",
                            });
                        }
                        toast(msg, { icon: "🎮" });
                        return;
                    }

                    // CRITICAL: Ensure we merge all fields correctly
                    setGameState((prevState) => {
                        const newState = {
                            ...prevState,
                            ...msg,
                            board: msg.board || prevState?.board,
                            players: msg.players || prevState?.players,
                            currentPlayer:
                                msg.currentPlayer || prevState?.currentPlayer,
                            gameOver:
                                msg.gameOver !== undefined
                                    ? msg.gameOver
                                    : prevState?.gameOver,
                            winner:
                                msg.winner !== undefined
                                    ? msg.winner
                                    : prevState?.winner,
                        };
                        console.log("New Game State updated:", newState);

                        // Trigger success event for UI components (like Voice Overlay)
                        window.dispatchEvent(
                            new CustomEvent("game-action-success")
                        );

                        return newState;
                    });
                }
            );

            // Subscribe to play again requests for this specific session
            const unsubscribePlayAgain = webSocketService.subscribe(
                `/topic/play-again/${gameState.sessionId}/${user.username}`,
                (msg) => {
                    console.log("Play again message:", msg);

                    // Handle both JSON string and object responses
                    let data = msg;
                    if (typeof msg === "string" && msg.startsWith("{")) {
                        try {
                            data = JSON.parse(msg);
                        } catch {
                            console.log("Could not parse message:", msg);
                        }
                    }

                    // Check for specific actions first (longer strings must be checked before shorter ones)
                    if (
                        (typeof msg === "string" &&
                            msg.includes("SESSION_ENDED")) ||
                        (typeof data === "object" &&
                            data.action === "SESSION_ENDED")
                    ) {
                        // Game session has been ended
                        toast("Game session has been ended", { icon: "🛑" });
                        setPlayAgainRequest(null);
                        // Reset game state
                        resetGame();
                    } else if (
                        (typeof msg === "string" &&
                            msg.includes("PLAY_AGAIN_ACCEPT")) ||
                        (typeof data === "object" &&
                            data.action === "PLAY_AGAIN_ACCEPT")
                    ) {
                        // Opponent accepted our request - update game state
                        if (
                            typeof data === "object" &&
                            data.board &&
                            data.currentPlayer !== undefined
                        ) {
                            setGameState((prevState) => ({
                                ...prevState,
                                ...data,
                                _resultTracked: false, // Reset result tracking flag for new game
                            }));
                        }
                        setPlayAgainRequest(null);
                        toast("Opponent accepted! Starting new game...", {
                            icon: "✅",
                        });
                    } else if (
                        (typeof msg === "string" &&
                            msg.includes("PLAY_AGAIN_REJECT")) ||
                        (typeof data === "object" &&
                            data.action === "PLAY_AGAIN_REJECT")
                    ) {
                        // Opponent rejected our request
                        setPlayAgainRequest("rejected");
                        toast("Opponent rejected your play again request", {
                            icon: "❌",
                        });
                    } else if (
                        typeof msg === "string" &&
                        msg.includes("PLAY_AGAIN")
                    ) {
                        // Opponent is requesting play again
                        setPlayAgainRequest("pending");
                        toast("Opponent wants to play again!", {
                            icon: "🎮",
                        });
                    }
                }
            );

            // Subscribe to session-specific matchmaking updates
            const unsubscribeMatchmaking = webSocketService.subscribe(
                `/topic/matchmaking/${gameState.sessionId}`,
                (msg) => {
                    console.log("Session matchmaking message:", msg);
                    if (typeof msg === "string") {
                        toast.success(msg);
                    }
                }
            );

            // Subscribe to session-specific notifications
            const unsubscribeNotifications = webSocketService.subscribe(
                `/topic/notifications/${gameState.sessionId}`,
                (msg) => {
                    console.log("Session notification received:", msg);
                    if (typeof msg === "string") {
                        toast(msg, { icon: "🔔" });
                    }
                    setNotifications((prev) => [...prev, msg]);
                }
            );

            // Subscribe to power-up activations
            const unsubscribePowerUps = webSocketService.subscribe(
                `/topic/powerups/${user.username}/activate`,
                (msg) => {
                    console.log("Power-up activation received:", msg);
                    if (typeof msg === "string") {
                        // The backend sends "{activationMessage} {powerUpType}"
                        // Supported types: EXTRA_MOVE, BLOCK_CELL, UNDO_MOVE, SWAP_CELL, HINT, GHOST_MOVE
                        const parts = msg.split(" ");
                        const powerUpType =
                            parts[parts.length - 1].toUpperCase();

                        // Human-friendly mapping for toasts
                        const nameMap = {
                            EXTRA_MOVE: "Extra Move",
                            BLOCK_CELL: "Block Cell",
                            UNDO_MOVE: "Undo Move",
                            SWAP_CELL: "Swap Cell",
                            HINT: "Hint",
                            GHOST_MOVE: "Ghost Move",
                        };

                        const displayName = nameMap[powerUpType] || powerUpType;
                        toast(`⚡ ${displayName} activated!`, { icon: "✨" });
                    }
                }
            );

            // Subscribe to error feedback (shared across move types)
            const unsubscribeErrors = webSocketService.subscribe(
                `/topic/game/${gameState.sessionId}`,
                (msg) => {
                    if (msg && msg.type === "ERROR") {
                        toast.error(msg.message || "Invalid move", {
                            id: "game-error",
                        });
                        // Dispatch event for UI components (like Voice Overlay) to handle
                        window.dispatchEvent(
                            new CustomEvent("game-error", {
                                detail: msg.message,
                            })
                        );
                    }
                }
            );

            // Cleanup subscriptions when session changes or component unmounts
            return () => {
                if (typeof unsubscribeActions === "function")
                    unsubscribeActions();
                if (typeof unsubscribePlayAgain === "function")
                    unsubscribePlayAgain();
                if (typeof unsubscribeMatchmaking === "function")
                    unsubscribeMatchmaking();
                if (typeof unsubscribeNotifications === "function")
                    unsubscribeNotifications();
                if (typeof unsubscribePowerUps === "function")
                    unsubscribePowerUps();
                if (typeof unsubscribeErrors === "function")
                    unsubscribeErrors();
            };
        }
    }, [gameState?.sessionId, user?.username]);

    // Track game results when the game ends
    useEffect(() => {
        if (
            gameState?.gameOver &&
            gameState?.players &&
            user?.username &&
            !gameState._resultTracked
        ) {
            const playerIds = Object.keys(gameState.players);
            const opponentId = playerIds.find((id) => id !== user.username);

            if (opponentId) {
                if (!gameState.players) return;
                const isWin = gameState.winner === user.username;
                const isDraw = !gameState.winner && gameState.gameOver;

                // Send result via WebSocket instead of REST API
                webSocketService.send(`/app/${gameState.sessionId}/game.end`, {
                    playerId: user.username,
                    againstPlayerId: opponentId,
                    win: isWin,
                    draw: isDraw,
                });

                // Mark locally as tracked to prevent duplicate WebSocket messages
                // Use setTimeout to avoid synchronous state update in effect warning
                setTimeout(() => {
                    setGameState((prev) => ({ ...prev, _resultTracked: true }));
                }, 0);
            }
        }
    }, [
        gameState?.gameOver,
        gameState?.winner,
        gameState?.players,
        gameState?.sessionId,
        gameState?._resultTracked,
        user?.username,
    ]);

    const startMatchmaking = async () => {
        // If we have a game session that is over, clear it so we can start a new match
        if (gameState && gameState.gameOver) {
            setGameState(null);
            setMatchmaking(false);
            setPlayAgainRequest(null);
            setPlayAgainFrom(null);
            setActivePowerUp(null);
        }

        if (
            matchmaking ||
            (gameState && gameState.sessionId && !gameState.gameOver)
        )
            return;
        setMatchmaking(true);
        try {
            const initialStatus = await gameService.join();
            // If the server immediately returns a game state (e.g. you were already in a game)
            if (initialStatus && initialStatus.sessionId) {
                setGameState(initialStatus);
                setMatchmaking(false);
            }
        } catch (error) {
            console.error("Matchmaking join failed:", error);
            setMatchmaking(false);
            toast.error("Matchmaking failed to start. Please try again.");
        }
    };

    const cancelMatchmaking = async () => {
        const currentSessionId = gameState?.sessionId;
        setMatchmaking(false);
        setGameState(null); // Clear state immediately for UI
        try {
            if (currentSessionId) {
                await gameService.leave({
                    sessionId: currentSessionId,
                    playerId: user.username,
                });
            }
        } catch (error) {
            console.error("Failed to leave game:", error);
        }
    };

    const makeMove = async (row, col) => {
        if (!gameState || gameState.gameOver) return;

        console.log("WebSocket Sending Move:", {
            sessionId: gameState.sessionId,
            row,
            col,
            player: user.username,
        });

        // Use WebSocket instead of REST for high-speed moves
        webSocketService.send(`/app/game/move`, {
            sessionId: gameState.sessionId,
            row,
            col,
            player: user.username,
        });
    };

    const sendVoiceMove = (text) => {
        if (!gameState || gameState.gameOver || !user?.username) return;

        webSocketService.send(`/app/game/voice-move`, {
            command: text,
            player: user.username,
            sessionId: gameState.sessionId,
        });
    };

    const requestPlayAgainGame = async () => {
        try {
            if (gameState?.sessionId && user?.username) {
                setPlayAgainRequest("requested");
                await gameService.requestPlayAgain(
                    gameState.sessionId,
                    user.username
                );
            }
        } catch (error) {
            console.error("Failed to request play again:", error);
            setPlayAgainRequest(null);
        }
    };

    const acceptPlayAgainGame = async () => {
        try {
            if (gameState?.sessionId && user?.username) {
                setPlayAgainRequest("accepted");
                const response = await gameService.acceptPlayAgain(
                    gameState.sessionId,
                    user.username
                );
                // Update game state with the returned session data
                if (response) {
                    setGameState({
                        ...gameState,
                        ...response,
                        _resultTracked: false, // Reset result tracking flag for new game
                    });
                    setPlayAgainRequest(null);
                }
            }
        } catch (error) {
            console.error("Failed to accept play again:", error);
            setPlayAgainRequest(null);
        }
    };

    const rejectPlayAgainGame = async () => {
        try {
            if (gameState?.sessionId && user?.username) {
                setPlayAgainRequest("rejected");
                await gameService.rejectPlayAgain(
                    gameState.sessionId,
                    user.username
                );
                // End the game session to clean up on backend
                await gameService.endGame(gameState.sessionId);
            }
        } catch (error) {
            console.error("Failed to reject play again:", error);
            setPlayAgainRequest(null);
        }
    };

    const leaveSession = async () => {
        await cancelMatchmaking();
        resetGame();
    };

    const usePowerUp = async (powerUpType, row = null, col = null) => {
        if (!gameState || gameState.gameOver) return;

        // High-speed WebSocket activation
        webSocketService.send(`/app/game/activate`, {
            sessionId: gameState.sessionId,
            playerId: user.username,
            powerUpType,
            targetRow: row,
            targetCol: col,
        });

        // Clear active power up selection immediately
        setActivePowerUp(null);
    };

    // Memoize contexts to prevent downstream re-renders
    const gameValue = useMemo(
        () => ({
            gameState,
            connected,
            reconnecting,
            notifications,
            playAgainRequest,
            playAgainFrom,
            makeMove,
            resetGame,
            leaveSession,
            requestPlayAgainGame,
            acceptPlayAgainGame,
            rejectPlayAgainGame,
            sendVoiceMove,
        }),
        [
            gameState,
            connected,
            reconnecting,
            notifications,
            playAgainRequest,
            playAgainFrom,
        ]
    );

    const matchmakingValue = useMemo(
        () => ({
            matchmaking,
            startMatchmaking,
            cancelMatchmaking,
        }),
        [matchmaking]
    );

    const powerUpValue = useMemo(
        () => ({
            availablePowerUps,
            playerStats,
            activePowerUp,
            setActivePowerUp,
            usePowerUp,
        }),
        [availablePowerUps, playerStats, activePowerUp]
    );

    return (
        <GameContext.Provider value={gameValue}>
            <MatchmakingContext.Provider value={matchmakingValue}>
                <PowerUpContext.Provider value={powerUpValue}>
                    {children}
                </PowerUpContext.Provider>
            </MatchmakingContext.Provider>
        </GameContext.Provider>
    );
};
