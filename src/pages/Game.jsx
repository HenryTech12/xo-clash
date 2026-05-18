import React, { useEffect, useState, memo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGame";
import { useVoiceInput } from "../hooks/useVoiceInput";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    LogOut,
    Mic,
    Lock,
    RefreshCcw,
    Home,
    Zap,
    Check,
    X,
} from "lucide-react";
import { gameService } from "../services/api";
import confetti from "canvas-confetti";
import { toast } from "react-hot-toast";
import { POWER_UP_CONFIG } from "../config/powerUpConfig";
import PowerUpActivationNotification from "../components/PowerUpActivationNotification";
import ActivePowerUpsPanel from "../components/ActivePowerUpsPanel";
import VoiceOverlay from "../components/VoiceOverlay";

// Memoized Board Cell Component for performance
const BoardCell = memo(
    ({ row, col, value, isSuggested, isTargeting, canClick, onClick }) => {
        return (
            <motion.button
                layoutId={`cell-${row}-${col}`}
                whileHover={
                    canClick
                        ? {
                              backgroundColor: isTargeting
                                  ? "rgba(236, 72, 153, 0.2)"
                                  : "rgba(59, 130, 246, 0.2)",
                              boxShadow: isTargeting
                                  ? "0 0 20px rgba(236, 72, 153, 0.3)"
                                  : "0 0 20px rgba(59, 130, 246, 0.3)",
                          }
                        : {}
                }
                whileTap={canClick ? { scale: 0.85 } : {}}
                onClick={onClick}
                disabled={!canClick}
                className={`w-full h-24 md:h-32 rounded-2xl flex items-center justify-center text-5xl md:text-7xl font-black transition-all border-2
      ${
          isTargeting
              ? "bg-pink-500/10 border-pink-500/50 cursor-crosshair hover:border-pink-400"
              : isSuggested
              ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)] animate-pulse"
              : !value && canClick
              ? "bg-slate-800/30 border-blue-500/30 cursor-pointer hover:border-blue-400/60"
              : "bg-slate-900/50 border-slate-700/50 cursor-default"
      }
      ${
          value === "X"
              ? "text-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] border-blue-500/50"
              : value === "O"
              ? "text-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-500/50"
              : ""
      }
    `}
            >
                <AnimatePresence mode="wait">
                    {value && (
                        <motion.span
                            key={`${row}-${col}-${value}`}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                type: "spring",
                                damping: 8,
                                stiffness: 150,
                            }}
                        >
                            {value}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    }
);

BoardCell.displayName = "BoardCell";

// Rank thresholds for power-up unlocking
const RANK_THRESHOLDS = {
    Bronze: 0,
    Silver: 200,
    Gold: 380,
    Platinum: 450,
    Diamond: 600,
    Master: 800,
    Grandmaster: 1000,
};

const Game = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const {
        gameState,
        makeMove,
        usePowerUp: activatePowerUp,
        availablePowerUps,
        playerStats,
        activePowerUp,
        setActivePowerUp,
        resetGame,
        leaveSession,
        playAgainRequest,
        requestPlayAgainGame,
        acceptPlayAgainGame,
        rejectPlayAgainGame,
        sendVoiceMove,
    } = useGame();

    const {
        isListening,
        isProcessing,
        isVoiceActive,
        showPopup,
        setShowPopup,
        transcript,
        error,
        startListening,
        stopListening,
        setProcessingState,
        setExternalError,
    } = useVoiceInput((command) => {
        sendVoiceMove(command);
    });

    // Listen for backend errors to update voice UI
    useEffect(() => {
        const handleError = (e) => {
            setExternalError(e.detail || "Invalid command");
        };

        const handleSuccess = () => {
            // Note: We no longer auto-stopListening() on success
            // because the user wants voice mode to remain active
            // but we might want to clear errors or processing state
            setProcessingState(false);
        };

        window.addEventListener("game-error", handleError);
        window.addEventListener("game-action-success", handleSuccess);

        return () => {
            window.removeEventListener("game-error", handleError);
            window.removeEventListener("game-action-success", handleSuccess);
        };
    }, [setExternalError, setProcessingState]);

    // Setup local state for HINT suggestion
    const [suggestedMove, setSuggestedMove] = useState(null);

    // Track activated power-up for notification (Stubbed for now)
    const activatedPowerUp = null;
    const activePowerUpsDisplay = [];

    // Provide hint logic purely generated on frontend
    const calculateHint = () => {
        if (!gameState || !gameState.board) return;
        const board = gameState.board;
        // Simple Minimax or random empty cell detection
        let available = [];
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (!board[r][c]) {
                    available.push({ r, c });
                }
            }
        }
        if (available.length > 0) {
            // Picking a random available spot as hint, could be upgraded to minimax
            // eslint-disable-next-line
            const randomSpot =
                available[Math.floor(Math.random() * available.length)];
            setSuggestedMove(`${randomSpot.r}-${randomSpot.c}`);
            setTimeout(() => setSuggestedMove(null), 3000); // Clear after 3 seconds
        }
    };

    // Handle PowerUp triggering
    const handlePowerUpClick = (powerUp, count) => {
        // Prevent selecting power-ups during opponent's turn
        if (!isMyTurn) {
            toast.error("Wait for your turn to use power-ups!");
            return;
        }

        if (count <= 0) {
            toast.error("You don't have any of this power-up left!");
            return;
        }

        // Rank validation logic
        const config = POWER_UP_CONFIG[powerUp];
        // Use rankPoints if available, otherwise fallback to rank_points or user object
        const userPoints =
            (playerStats &&
                (playerStats.rankPoints !== undefined
                    ? playerStats.rankPoints
                    : playerStats.rank_points)) ||
            user?.rankPoints ||
            0;

        const requiredRank = config?.unlockRank || "Bronze";
        const requiredPoints = RANK_THRESHOLDS[requiredRank] || 0;

        if (userPoints < requiredPoints) {
            toast.error(
                `Locked! You need ${requiredPoints} rank points (${requiredRank} rank) to use ${
                    config?.name || powerUp
                }. Your points: ${userPoints}`
            );
            return;
        }

        if (powerUp === "EXTRA_MOVE" || powerUp === "UNDO_MOVE") {
            activatePowerUp(powerUp); // No target needed
        } else if (powerUp === "HINT") {
            calculateHint();
        } else {
            // Target needed
            setActivePowerUp(powerUp === activePowerUp ? null : powerUp);
        }
    };

    // Handle ending the game session and returning to lobby
    const handleReturnToLobby = async () => {
        try {
            if (gameState?.sessionId) {
                await gameService.endGame(gameState.sessionId);
            }
        } catch (error) {
            console.error("Failed to end game session:", error);
        } finally {
            resetGame();
            // Navigate back to dashboard after a brief delay to allow cleanup
            setTimeout(() => {
                navigate("/dashboard", { replace: true });
            }, 300);
        }
    };

    // Final check for standard fields
    if (!gameState || !gameState.players) return null;

    // Use actual board or empty 3x3 if missing
    const board = gameState.board || [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
    ];

    const playerX = Object.keys(gameState.players).find(
        (key) => gameState.players[key] === "X"
    );

    const playerO = Object.keys(gameState.players).find(
        (key) => gameState.players[key] === "O"
    );

    playerX; // Keep for usage
    playerO; // Keep for usage

    const mySymbol = gameState.players[user.username];
    // Allow turn check to work with either Username OR Symbol
    const currentTurnIdentifier = String(gameState.currentPlayer).toUpperCase();
    const isMyTurn =
        currentTurnIdentifier === user.username.toUpperCase() ||
        currentTurnIdentifier === String(mySymbol).toUpperCase();

    console.log("Turn check:", {
        isMyTurn,
        currentPlayer: gameState.currentPlayer,
        username: user.username,
        mySymbol,
    });

    const opponentName = Object.keys(gameState.players).find(
        (username) => username !== user.username
    );

    const isWinner =
        gameState.winner === user.username ||
        (gameState.winner && gameState.winner === mySymbol);

    if (gameState.gameOver && isWinner) {
        confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.5 },
            colors: ["#3B82F6", "#A855F7", "#EC4899"],
            gravity: 0.8,
            decay: 0.95,
        });
    }

    const onCellClick = useCallback(
        (row, col, canClick, isTargeting, value, activePowerUp) => {
            console.log(
                `Cell Click Handler triggered for [${row}, ${col}], canClick: ${canClick}`
            );
            if (canClick) {
                if (isTargeting) {
                    activatePowerUp(activePowerUp, row, col);
                } else {
                    makeMove(row, col);
                }
            }
        },
        [activatePowerUp, makeMove]
    );

    const renderCell = (row, col) => {
        const board = gameState.board || [
            ["", "", ""],
            ["", "", ""],
            ["", "", ""],
        ];
        const value = board[row][col];

        // Hint logic
        const isSuggested = suggestedMove === `${row}-${col}`;

        // Power-up targeting logic
        const isTargeting =
            activePowerUp &&
            activePowerUp !== "EXTRA_MOVE" &&
            activePowerUp !== "UNDO_MOVE" &&
            activePowerUp !== "HINT";

        // Only allow click if turn matches, cell is empty, and game not over
        // UNLESS we are targeting a power-up (e.g. BLOCK_CELL) which might target ANY cell
        const canClick =
            isMyTurn &&
            !gameState.gameOver &&
            (isTargeting || value === "" || value === null || !value);

        return (
            <BoardCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={value}
                isSuggested={isSuggested}
                isTargeting={isTargeting}
                canClick={canClick}
                onClick={() =>
                    onCellClick(
                        row,
                        col,
                        canClick,
                        isTargeting,
                        value,
                        activePowerUp
                    )
                }
            />
        );
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 md:p-8 flex flex-col items-center text-white overflow-hidden relative">
            <VoiceOverlay
                isVisible={showPopup}
                isListening={isListening}
                isProcessing={isProcessing}
                transcript={transcript}
                error={error}
                onClose={() => setShowPopup(false)}
            />
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 20, repeat: Infinity }}
                    className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/15 blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{
                        x: [0, -100, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 25, repeat: Infinity }}
                    className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/15 blur-[120px] rounded-full"
                />
            </div>

            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg flex justify-between items-center mb-10 z-10"
            >
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <button
                        onClick={resetGame}
                        className="p-3 bg-slate-800/60 hover:bg-slate-700/80 rounded-xl transition-all border border-slate-700/50 backdrop-blur-md group shadow-lg hover:shadow-slate-700/40"
                    >
                        <ArrowLeft
                            size={22}
                            className="group-hover:-translate-x-1 transition-transform"
                        />
                    </button>
                </motion.div>

                <div className="text-center">
                    <motion.h2
                        className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-1"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        ⚡ ARENA BATTLE
                    </motion.h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
                        Room: {gameState.sessionId.slice(0, 8)}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={
                            isVoiceActive
                                ? () => setShowPopup(true)
                                : startListening
                        }
                        className={`p-3 rounded-xl transition-all border backdrop-blur-md shadow-lg flex items-center justify-center ${
                            isVoiceActive
                                ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-400 hover:text-blue-300"
                        }`}
                        title={
                            isVoiceActive
                                ? "Voice AI Active"
                                : "Activate Voice AI"
                        }
                    >
                        <Mic
                            size={22}
                            className={isVoiceActive ? "animate-pulse" : ""}
                        />
                    </motion.button>

                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <button
                            onClick={leaveSession}
                            className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all border border-red-500/30 backdrop-blur-md group shadow-lg"
                            title="Leave Session"
                        >
                            <LogOut
                                size={22}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Player Info (Revamped) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="w-full max-w-lg grid grid-cols-2 gap-4 mb-10 z-10"
            >
                <PlayerCard
                    name={user.username}
                    symbol={mySymbol}
                    isTurn={isMyTurn && !gameState.gameOver}
                    isSelf={true}
                />
                <PlayerCard
                    name={opponentName || "Matching..."}
                    symbol={mySymbol === "X" ? "O" : "X"}
                    isTurn={!isMyTurn && !gameState.gameOver && !!opponentName}
                    isSelf={false}
                />
            </motion.div>

            {/* Game Board (Revamped) */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative p-6 bg-linear-to-br from-slate-800/40 to-slate-900/40 rounded-[3rem] border border-slate-700/30 backdrop-blur-xl shadow-2xl shadow-blue-500/10 z-10"
            >
                <div className="grid grid-cols-3 gap-4 w-80 h-80 md:w-96 md:h-96">
                    {board.map((row, rIdx) =>
                        row.map((_, cIdx) => renderCell(rIdx, cIdx))
                    )}
                </div>

                {/* Game Result Overlay */}
                <AnimatePresence>
                    {gameState.gameOver && (
                        <motion.div
                            initial={{
                                opacity: 0,
                                backdropFilter: "blur(0px)",
                            }}
                            animate={{
                                opacity: 1,
                                backdropFilter: "blur(12px)",
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-x-0 inset-y-0 z-20 flex flex-col items-center justify-center rounded-[3rem] bg-slate-900/70 p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.5, y: 40 }}
                                animate={{ scale: 1, y: 0 }}
                                transition={{
                                    type: "spring",
                                    damping: 10,
                                    stiffness: 150,
                                }}
                                className="bg-linear-to-br from-slate-800/80 to-slate-900/80 p-10 rounded-3xl border border-slate-700/50 shadow-2xl text-center w-full max-w-xs backdrop-blur-sm"
                            >
                                <motion.h3
                                    className={`text-5xl font-black mb-4 italic tracking-tighter ${
                                        gameState.winner
                                            ? isWinner
                                                ? "text-transparent bg-clip-text bg-linear-to-r from-green-400 to-emerald-400"
                                                : "text-transparent bg-clip-text bg-linear-to-r from-red-400 to-pink-400"
                                            : "text-yellow-400"
                                    }`}
                                    animate={{ scale: [0.9, 1, 0.95] }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 2,
                                    }}
                                >
                                    {gameState.winner
                                        ? isWinner
                                            ? "🎉 VICTORY!"
                                            : "⚔️ DEFEAT"
                                        : "🤝 DRAW"}
                                </motion.h3>
                                <motion.p className="text-slate-300 mb-8 text-base font-medium tracking-wide">
                                    {gameState.winner
                                        ? `${gameState.winner} dominated the arena!`
                                        : "A perfectly executed stalemate!"}
                                </motion.p>
                                <div className="space-y-3">
                                    {/* Play Again Request Pending - Show Accept/Reject */}
                                    {playAgainRequest === "pending" ? (
                                        <>
                                            <motion.p className="text-center text-purple-400 font-bold animate-pulse mb-4">
                                                ⚡ Opponent wants to play again!
                                            </motion.p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={acceptPlayAgainGame}
                                                className="w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 transition-all"
                                            >
                                                <Check size={20} /> ACCEPT
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={rejectPlayAgainGame}
                                                className="w-full py-4 bg-linear-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition-all"
                                            >
                                                <X size={20} /> REJECT
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleReturnToLobby}
                                                className="w-full py-4 bg-slate-700/60 hover:bg-slate-600/80 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Home size={20} /> LOBBY
                                            </motion.button>
                                        </>
                                    ) : playAgainRequest === "requested" ? (
                                        <>
                                            <motion.p className="text-center text-blue-400 font-bold mb-4">
                                                ⏳ Waiting for opponent
                                                response...
                                            </motion.p>
                                            <motion.button
                                                animate={{
                                                    scale: [1, 1.05, 1],
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 2,
                                                }}
                                                disabled
                                                className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 opacity-70"
                                            >
                                                <Zap size={20} /> WAITING...
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleReturnToLobby}
                                                className="w-full py-4 bg-slate-700/60 hover:bg-slate-600/80 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Home size={20} /> LOBBY
                                            </motion.button>
                                        </>
                                    ) : playAgainRequest === "accepted" ? (
                                        <>
                                            <motion.p className="text-center text-green-400 font-bold mb-4">
                                                ✅ Starting new game!
                                            </motion.p>
                                            <motion.button
                                                animate={{
                                                    scale: [1, 1.05, 1],
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 1.5,
                                                }}
                                                disabled
                                                className="w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 opacity-70"
                                            >
                                                <RefreshCcw
                                                    size={20}
                                                    className="animate-spin"
                                                />{" "}
                                                NEW GAME
                                            </motion.button>
                                        </>
                                    ) : playAgainRequest === "rejected" ? (
                                        <>
                                            <motion.p className="text-center text-red-400 font-bold mb-4">
                                                ❌ Request rejected
                                            </motion.p>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={requestPlayAgainGame}
                                                className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                                            >
                                                <RefreshCcw size={20} /> TRY
                                                AGAIN
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleReturnToLobby}
                                                className="w-full py-4 bg-slate-700/60 hover:bg-slate-600/80 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Home size={20} /> LOBBY
                                            </motion.button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={requestPlayAgainGame}
                                                className="w-full py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                                            >
                                                <RefreshCcw size={20} /> PLAY
                                                AGAIN
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={handleReturnToLobby}
                                                className="w-full py-4 bg-slate-700/60 hover:bg-slate-600/80 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                                            >
                                                <Home size={20} /> LOBBY
                                            </motion.button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Status Footer */}
            <motion.div
                animate={
                    isMyTurn && !gameState.gameOver ? { y: [0, -8, 0] } : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-12 px-8 py-4 bg-linear-to-r from-blue-500/20 to-purple-500/20 rounded-2xl border border-blue-500/30 backdrop-blur-md z-10 shadow-lg shadow-blue-500/10"
            >
                <p className="text-base font-black tracking-widest text-slate-200 flex items-center justify-center gap-3">
                    {isMyTurn && !gameState.gameOver ? (
                        <>
                            <motion.span
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="relative flex h-4 w-4"
                            >
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500"></span>
                            </motion.span>
                            {activePowerUp
                                ? `SELECT TARGET FOR ${activePowerUp.replace(
                                      "_",
                                      " "
                                  )}`
                                : "YOUR TURN - MAKE YOUR MOVE!"}
                        </>
                    ) : gameState.gameOver ? (
                        <>
                            <Zap size={20} className="text-yellow-400" />
                            MATCH COMPLETE
                        </>
                    ) : (
                        <>
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                ⏳
                            </motion.span>
                            OPPONENT'S MOVE
                        </>
                    )}
                </p>
            </motion.div>

            {/* Power Ups Footer */}
            {!gameState.gameOver && availablePowerUps?.length > 0 && (
                <motion.div
                    className="mt-6 flex flex-wrap gap-3 justify-center z-10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {availablePowerUps.map((powerUpObj, idx) => {
                        const powerUp =
                            typeof powerUpObj === "string"
                                ? powerUpObj
                                : powerUpObj.powerupId || powerUpObj.id;
                        const count = powerUpObj.count ?? 1; // Default to 1 if not string but count missing

                        // We no longer return null for count <= 0 because we want to show it as locked
                        // if (count <= 0) return null;

                        return (
                            <motion.button
                                key={idx}
                                whileHover={
                                    isMyTurn &&
                                    count > 0 &&
                                    !(
                                        (user?.rankPoints || 0) <
                                        (RANK_THRESHOLDS[
                                            POWER_UP_CONFIG[powerUp]?.unlockRank
                                        ] || 0)
                                    )
                                        ? { scale: 1.05 }
                                        : {}
                                }
                                whileTap={
                                    isMyTurn &&
                                    count > 0 &&
                                    !(
                                        (user?.rankPoints || 0) <
                                        (RANK_THRESHOLDS[
                                            POWER_UP_CONFIG[powerUp]?.unlockRank
                                        ] || 0)
                                    )
                                        ? { scale: 0.95 }
                                        : {}
                                }
                                onClick={() =>
                                    handlePowerUpClick(powerUp, count)
                                }
                                className={`px-4 py-2 rounded-full font-bold shadow-lg border transition-all flex items-center gap-2
                                    ${
                                        activePowerUp === powerUp
                                            ? "bg-purple-600 text-white border-purple-400 shadow-purple-500/50 ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-900"
                                            : isMyTurn &&
                                              count > 0 &&
                                              !(
                                                  (user?.rankPoints || 0) <
                                                  (RANK_THRESHOLDS[
                                                      POWER_UP_CONFIG[powerUp]
                                                          ?.unlockRank
                                                  ] || 0)
                                              )
                                            ? "bg-slate-800/80 text-blue-300 border-slate-700 hover:bg-slate-700/80 hover:text-blue-200"
                                            : count <= 0 ||
                                              (user?.rankPoints || 0) <
                                                  (RANK_THRESHOLDS[
                                                      POWER_UP_CONFIG[powerUp]
                                                          ?.unlockRank
                                                  ] || 0)
                                            ? "bg-slate-900/60 text-slate-600 border-slate-800 cursor-not-allowed grayscale"
                                            : "bg-slate-900/40 text-slate-500 border-slate-800 cursor-not-allowed"
                                    }
                                `}
                            >
                                {count <= 0 ||
                                (user?.rankPoints || 0) <
                                    (RANK_THRESHOLDS[
                                        POWER_UP_CONFIG[powerUp]?.unlockRank
                                    ] || 0) ? (
                                    <Lock
                                        size={14}
                                        className="text-slate-600"
                                    />
                                ) : (
                                    "⚡"
                                )}
                                <span
                                    className={
                                        count <= 0 ||
                                        (user?.rankPoints || 0) <
                                            (RANK_THRESHOLDS[
                                                POWER_UP_CONFIG[powerUp]
                                                    ?.unlockRank
                                            ] || 0)
                                            ? "opacity-50"
                                            : ""
                                    }
                                >
                                    {powerUp.replace("_", " ")}
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded text-xs ml-1 ${
                                        count <= 0 ||
                                        (user?.rankPoints || 0) <
                                            (RANK_THRESHOLDS[
                                                POWER_UP_CONFIG[powerUp]
                                                    ?.unlockRank
                                            ] || 0)
                                            ? "bg-slate-800 text-slate-600"
                                            : "bg-slate-900 text-white"
                                    }`}
                                >
                                    x{count}
                                </span>
                                {(user?.rankPoints || 0) <
                                    (RANK_THRESHOLDS[
                                        POWER_UP_CONFIG[powerUp]?.unlockRank
                                    ] || 0) && (
                                    <span className="text-[10px] text-slate-400 font-black uppercase opacity-60">
                                        {POWER_UP_CONFIG[powerUp]?.unlockRank}
                                    </span>
                                )}
                                {activePowerUp === powerUp && (
                                    <span className="text-xs opacity-75">
                                        (active)
                                    </span>
                                )}
                            </motion.button>
                        );
                    })}
                </motion.div>
            )}

            {/* Power-up Activation Notification */}
            <PowerUpActivationNotification
                activatedPowerUp={activatedPowerUp}
                playerName={user?.username}
            />

            {/* Active Power-ups Panel */}
            <ActivePowerUpsPanel activePowerUps={activePowerUpsDisplay} />
        </div>
    );
};

const PlayerCard = ({ name, symbol, isTurn, isSelf }) => (
    <motion.div
        animate={
            isTurn
                ? {
                      scale: 1.08,
                      borderColor: "rgba(59, 130, 246, 0.8)",
                      boxShadow:
                          "0 0 30px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(59, 130, 246, 0.1)",
                  }
                : {
                      scale: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      boxShadow: "none",
                  }
        }
        transition={{ duration: 0.3 }}
        className={`p-5 rounded-2xl border-2 bg-linear-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-md relative overflow-hidden transition-all ${
            isTurn ? "ring-2 ring-blue-500/50" : ""
        }`}
    >
        {isTurn && (
            <>
                <motion.div
                    className="absolute inset-0 bg-blue-500/10 z-0"
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
                <motion.div
                    className="absolute -inset-1 border-2 border-blue-500/50 rounded-2xl z-0"
                    animate={{
                        boxShadow: [
                            "0 0 10px rgba(59, 130, 246, 0.3)",
                            "0 0 30px rgba(59, 130, 246, 0.6)",
                            "0 0 10px rgba(59, 130, 246, 0.3)",
                        ],
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                />
            </>
        )}

        <div className="relative z-10 flex flex-col items-center">
            <motion.span
                animate={isTurn ? { scale: [1, 1.1, 1] } : {}}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                }}
                className={`text-5xl font-black mb-2 ${
                    symbol === "X"
                        ? "text-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                        : "text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.6)]"
                }`}
            >
                {symbol}
            </motion.span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                {isSelf ? "🎮 YOU" : "⚔️ OPP"}
            </span>
            <span className="text-sm font-bold truncate max-w-full text-slate-200">
                {name}
            </span>
        </div>
    </motion.div>
);

export default Game;
