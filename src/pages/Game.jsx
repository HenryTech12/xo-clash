import { useEffect, useState, memo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGame";
import { useVoiceCommands } from "../hooks/useVoiceCommands";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    LogOut,
    Mic,
    Lock,
    RefreshCcw,
    Zap,
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
    ({
        row,
        col,
        value,
        isSuggested,
        isTargeting,
        isBlocked,
        isGhosted,
        canClick,
        onClick,
        mySymbol,
    }) => {
        const isX = value === "X";
        const isO = value === "O";
        const isGhostValue = !value && canClick;

        return (
            <motion.button
                layoutId={`cell-${row}-${col}`}
                whileHover={
                    canClick
                        ? {
                              backgroundColor: isTargeting
                                  ? "rgba(255, 45, 120, 0.15)"
                                  : "rgba(0, 212, 255, 0.08)",
                              boxShadow: isTargeting
                                  ? "0 0 25px rgba(255, 45, 120, 0.4), inset 0 0 15px rgba(255, 45, 120, 0.2)"
                                  : "0 0 25px rgba(0, 212, 255, 0.2), inset 0 0 15px rgba(0, 212, 255, 0.1)",
                              scale: 1.02,
                              translateZ: 20
                          }
                        : {}
                }
                whileTap={canClick ? { scale: 0.95, translateZ: 0 } : {}}
                onClick={onClick}
                disabled={!canClick}
                className={`w-full h-full rounded-xl flex items-center justify-center transition-all border relative overflow-hidden group
      ${
          isTargeting
              ? "bg-plasma-pink/10 border-plasma-pink cursor-crosshair shadow-[0_0_15px_rgba(255,45,120,0.2)]"
              : isSuggested
              ? "bg-plasma-gold/20 border-plasma-gold shadow-[0_0_20px_rgba(255,215,0,0.4)] animate-pulse"
              : !value && canClick
              ? "bg-arena-surface/40 border-plasma-blue/20 cursor-pointer hover:border-plasma-blue/60"
              : "bg-arena-surface/60 border-white/5 cursor-default"
      }
    `}
    style={{ transformStyle: 'preserve-3d' }}
            >
                {/* Visual indicator for Blocked (B) or Ghosted (G) cells */}
                {isBlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-plasma-pink/10 backdrop-blur-[2px] z-20">
                        <Lock className="text-plasma-pink opacity-80 drop-shadow-[0_0_8px_#FF2D78]" size={36} />
                    </div>
                )}
                
                {/* Ghosted Effect Overlay */}
                {isGhosted && (
                    <div className="absolute inset-0 bg-plasma-blue/10 backdrop-blur-[1px] z-10 flex items-center justify-center">
                         <Zap className="text-plasma-blue opacity-50 animate-pulse" size={32} />
                    </div>
                )}

                {/* Grid Lines Glow Emulation */}
                <div className="absolute inset-0 border border-plasma-blue/5 pointer-events-none group-hover:border-plasma-blue/20 transition-colors" />

                {/* Hover Ghost Symbol */}
                {isGhostValue && !isTargeting && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none">
                         <span className="text-6xl font-black font-orbitron">{mySymbol}</span>
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {value && (
                        <motion.div
                            key={`${row}-${col}-${value}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative z-10 w-[80%] h-[80%] flex items-center justify-center"
                        >
                            {isX ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full p-2 drop-shadow-[0_0_12px_#00D4FF]">
                                    <motion.line
                                        x1="20" y1="20" x2="80" y2="80"
                                        stroke="#00D4FF" strokeWidth="12" strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                    />
                                    <motion.line
                                        x1="80" y1="20" x2="20" y2="80"
                                        stroke="#00D4FF" strokeWidth="12" strokeLinecap="round"
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                                    />
                                </svg>
                            ) : isO ? (
                                <svg viewBox="0 0 100 100" className="w-full h-full p-2 drop-shadow-[0_0_12px_#BF5FFF]">
                                    <motion.circle
                                        cx="50" cy="50" r="35"
                                        stroke="#BF5FFF" strokeWidth="12" strokeLinecap="round" fill="transparent"
                                        initial={{ pathLength: 0, rotate: -90 }}
                                        animate={{ pathLength: 1, rotate: 270 }}
                                        transition={{ duration: 0.6, ease: "easeInOut" }}
                                    />
                                </svg>
                            ) : (
                                <span className={`text-4xl font-black font-orbitron ${value === 'B' ? 'text-plasma-pink' : 'text-plasma-blue'}`}>
                                    {value}
                                </span>
                            )}
                        </motion.div>
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
    const [voiceLang, setVoiceLang] = useState("en");
    const {
        gameState,
        makeMove,
        usePowerUp: activatePowerUp,
        availablePowerUps,
        activePowerUp,
        setActivePowerUp,
        resetGame,
        leaveSession,
        playAgainRequest,
        requestPlayAgainGame,
        acceptPlayAgainGame,
        rejectPlayAgainGame,
    } = useGame();

    const mySymbol = gameState?.players?.[user?.username];
    const isMyTurn = gameState?.currentPlayer === mySymbol;
    const opponentName = gameState?.players ? Object.keys(gameState.players).find(u => u !== user?.username) : null;
    const isWinner = gameState?.winner === user?.username;

    // Setup local state for HINT suggestion
    const [suggestedMove, setSuggestedMove] = useState(null);
    const [playerRankPoints, setPlayerRankPoints] = useState(0);

    // Fetch player rank points on mount
    useEffect(() => {
        const fetchPlayerStats = async () => {
            if (user?.username) {
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_API_URL}/api/v1/players/${user.username}/stats`,
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem("token")}`,
                            },
                        }
                    );
                    if (response.ok) {
                        const data = await response.json();
                        setPlayerRankPoints(data.rankPoints ?? data.points ?? 0);
                    }
                } catch (err) {
                    console.error("Failed to fetch player stats in Game:", err);
                }
            }
        };
        fetchPlayerStats();
    }, [user?.username]);

    // Track activated power-up for notification (Stubbed for now)
    const [activatedPowerUp, setActivatedPowerUp] = useState(null);
    const activePowerUpsDisplay = activePowerUp ? [activePowerUp] : [];

    // Wrap usePowerUp to track activation for notification
    const handleActivatePowerUp = useCallback(async (powerUpName, row, col) => {
        const success = await activatePowerUp(powerUpName, row, col);
        if (success !== false) { // Assuming useGame's usePowerUp returns something on success
            setActivatedPowerUp(powerUpName);
            setTimeout(() => setActivatedPowerUp(null), 3000);
        }
        return success;
    }, [activatePowerUp]);

    // Minimax algorithm for HINT (BUG 7)
    const minimax = useCallback((board, depth, isMaximizing, mySymbol, opponentSymbol) => {
        const checkWin = (b, s) => {
            for (let i = 0; i < 3; i++) {
                if (b[i][0] === s && b[i][1] === s && b[i][2] === s) return true;
                if (b[0][i] === s && b[1][i] === s && b[2][i] === s) return true;
            }
            if (b[0][0] === s && b[1][1] === s && b[2][2] === s) return true;
            if (b[0][2] === s && b[1][1] === s && b[2][0] === s) return true;
            return false;
        };

        const solve = (b, d, isMax) => {
            if (checkWin(b, mySymbol)) return 10 - d;
            if (checkWin(b, opponentSymbol)) return d - 10;

            let available = [];
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 3; c++) {
                    if (!b[r][c]) available.push({ r, c });
                }
            }

            if (available.length === 0) return 0;

            if (isMax) {
                let best = -Infinity;
                for (const { r, c } of available) {
                    b[r][c] = mySymbol;
                    best = Math.max(best, solve(b, d + 1, false));
                    b[r][c] = "";
                }
                return best;
            } else {
                let best = Infinity;
                for (const { r, c } of available) {
                    b[r][c] = opponentSymbol;
                    best = Math.min(best, solve(b, d + 1, true));
                    b[r][c] = "";
                }
                return best;
            }
        };

        return solve(board, depth, isMaximizing);
    }, []);

    const calculateHint = useCallback(() => {
        if (!gameState || !gameState.board || !mySymbol) return;
        const opponentSymbol = mySymbol === "X" ? "O" : "X";
        const tempBoard = gameState.board.map(row => [...row]);
        
        let bestVal = -Infinity;
        let bestMove = null;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (!tempBoard[r][c]) {
                    tempBoard[r][c] = mySymbol;
                    let moveVal = minimax(tempBoard, 0, false, mySymbol, opponentSymbol);
                    tempBoard[r][c] = "";
                    if (moveVal > bestVal) {
                        bestVal = moveVal;
                        bestMove = { r, c };
                    }
                }
            }
        }
        
        if (bestMove) {
            setSuggestedMove(`${bestMove.r}-${bestMove.c}`);
            setTimeout(() => setSuggestedMove(null), 3000);
        }
    }, [gameState, mySymbol, minimax]);

    // Handle PowerUp triggering
    const handlePowerUpClick = useCallback(
        (powerUp, count) => {
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
            // Match the logic in PlayerStatsCard with Added localStorage fallback
            const userPoints = gameState?.rankPoints ?? playerRankPoints ?? 0;

            const requiredRank = config?.unlockRank || "Bronze";
            const requiredPoints = RANK_THRESHOLDS[requiredRank] || 0;

            // Note: The UI lock icons display requirements, but we allow clicking
            // if user has points OR if the backend specifically provided this power-up.
            // If the power-up is in availablePowerUps with count > 0, we trust the backend.
            const isActuallyUnlocked = availablePowerUps.some(
                (up) => up.id === powerUp && up.count > 0
            );

            if (userPoints < requiredPoints && !isActuallyUnlocked) {
                toast.error(
                    `Locked! You need ${requiredPoints} rank points (${requiredRank} rank) to use ${
                        config?.name || powerUp
                    }. Your points: ${userPoints}`
                );
                return;
            }

            if (powerUp === "EXTRA_MOVE" || powerUp === "UNDO_MOVE") {
                handleActivatePowerUp(powerUp); // No target needed
            } else if (powerUp === "HINT") {
                calculateHint();
            } else {
                // Target needed for BLOCK_CELL, SWAP_CELL, and GHOST_MOVE
                setActivePowerUp(powerUp === activePowerUp ? null : powerUp);
            }
        },
        [
            isMyTurn,
            gameState?.rankPoints,
            playerRankPoints,
            availablePowerUps,
            handleActivatePowerUp,
            calculateHint,
            activePowerUp,
            setActivePowerUp,
        ]
    );

    const onCellClick = useCallback(
        (row, col, canClick, isTargeting, value, activePowerUp) => {
            if (canClick) {
                if (isTargeting) {
                    handleActivatePowerUp(activePowerUp, row, col);
                } else {
                    makeMove(row, col);
                }
            }
        },
        [handleActivatePowerUp, makeMove]
    );

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

    const {
        isListening,
        isProcessing,
        isVoiceActive,
        showPopup,
        setShowPopup,
        transcript,
        error,
        startListening,
        setProcessingState,
        setExternalError,
    } = useVoiceCommands({
        language: voiceLang, 
        makeMove: (r, c) => onCellClick(r, c, true, !!activePowerUp, null, activePowerUp),
        activatePowerUp: handlePowerUpClick,
        leaveSession: handleReturnToLobby,
        requestPlayAgainGame
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

    // Trigger confetti on win
    useEffect(() => {
        if (gameState?.gameOver && isWinner) {
            confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: ["#FFD700", "#00D4FF", "#BF5FFF"],
                gravity: 0.8,
                decay: 0.95,
            });
        }
    }, [gameState?.gameOver, isWinner]);

    // Final check for standard fields
    if (!gameState || !gameState.players) return null;

    const board = gameState.board || [
        ["", "", ""],
        ["", "", ""],
        ["", "", ""],
    ];

    const renderCell = (row, col) => {
        const value = board[row][col];

        // Ghost and Block cell visual overrides
        const displayValue = value === "B" || value === "G" ? "" : value;
        const isBlocked = value === "B";
        const isGhosted = value === "G";

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
            (isTargeting || !value || value === "");

        return (
            <BoardCell
                key={`${row}-${col}`}
                row={row}
                col={col}
                value={displayValue}
                isSuggested={isSuggested}
                isTargeting={isTargeting}
                isBlocked={isBlocked}
                isGhosted={isGhosted}
                canClick={canClick}
                mySymbol={mySymbol}
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
        <div className="min-h-screen bg-arena-dark p-4 md:p-8 flex flex-col items-center text-white overflow-hidden relative font-rajdhani">
            <VoiceOverlay
                isVisible={showPopup}
                isListening={isListening}
                isProcessing={isProcessing}
                transcript={transcript}
                error={error}
                onClose={() => setShowPopup(false)}
            />
            {/* Holographic Grid Background */}
            <div className="fixed inset-0 holo-grid pointer-events-none opacity-20" />
            <div className="fixed inset-0 scanlines pointer-events-none" />

            {/* Animated Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-plasma-blue blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-plasma-purple blur-[120px] rounded-full"
                />
            </div>

            {/* Tactical Display Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-6xl flex justify-between items-center mb-10 z-10"
            >
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1, x: -5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={resetGame}
                        className="p-3 bg-arena-surface/40 hover:bg-arena-surface/60 rounded-xl border border-white/10 backdrop-blur-md group shadow-lg"
                    >
                        <ArrowLeft size={20} className="text-plasma-blue group-hover:-translate-x-1 transition-transform" />
                    </motion.button>
                    <div>
                        <h2 className="text-xs font-black font-orbitron text-plasma-blue uppercase tracking-[0.4em] drop-shadow-[0_0_8px_#00D4FF]">
                            Neural Arena
                        </h2>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            CH: 0x{gameState.sessionId.slice(0, 6).toUpperCase()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setVoiceLang(prev => prev === "en" ? "es" : "en")}
                        className="px-4 py-2 bg-arena-surface/40 text-plasma-blue rounded-xl border border-white/10 backdrop-blur-md text-[10px] font-black font-orbitron shadow-lg"
                    >
                        LANG: {voiceLang.toUpperCase()}
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(191,95,255,0.4)" }}
                        whileTap={{ scale: 0.9 }}
                        onClick={isVoiceActive ? () => setShowPopup(true) : startListening}
                        className={`p-3 rounded-xl border backdrop-blur-md shadow-lg flex items-center justify-center transition-all ${
                            isVoiceActive
                                ? "bg-plasma-purple border-plasma-purple text-white shadow-[0_0_20px_#BF5FFF]"
                                : "bg-plasma-blue/10 border-plasma-blue/30 text-plasma-blue"
                        }`}
                    >
                        <Mic size={20} className={isVoiceActive ? "animate-pulse" : ""} />
                    </motion.button>

                    <button
                        onClick={leaveSession}
                        className="p-3 bg-plasma-pink/10 hover:bg-plasma-pink/20 text-plasma-pink rounded-xl border border-plasma-pink/30 shadow-lg group transition-all"
                    >
                        <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </motion.div>

            {/* Battle Environment */}
            <main className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center gap-10 z-10">
                
                {/* Player Cards Flanking VS */}
                <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12 mb-4">
                    <PlayerCard
                        name={user.username}
                        symbol={mySymbol}
                        isTurn={isMyTurn && !gameState.gameOver}
                        isSelf={true}
                    />

                    <div className="relative flex flex-col items-center justify-center px-4">
                        {/* Plasma Divider Line */}
                        <div className="absolute h-32 w-px bg-linear-to-b from-transparent via-plasma-blue to-transparent opacity-50 hidden md:block" />
                        <motion.div 
                            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="text-5xl font-black font-orbitron text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] z-10 relative"
                        >
                            VS
                        </motion.div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-plasma-blue/10 blur-3xl rounded-full" />
                    </div>

                    <PlayerCard
                        name={opponentName || "SEARCHING..."}
                        symbol={mySymbol === "X" ? "O" : "X"}
                        isTurn={!isMyTurn && !gameState.gameOver}
                        isSelf={false}
                    />
                </div>

                {/* Tactical Arena */}
                <div className="flex flex-col items-center">

            {/* 3D Game Board */}
            <motion.div
                initial={{ rotateX: 20, opacity: 0, y: 50 }}
                animate={{ rotateX: 8, opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative p-8 bg-arena-mid/40 rounded-4xl border border-plasma-blue/20 backdrop-blur-xl shadow-[0_40px_80px_rgba(0,0,0,0.8),0_0_60px_rgba(0,212,255,0.05)] z-10"
                style={{ transformStyle: 'preserve-3d', perspective: 800 }}
            >
                <div className="grid grid-cols-3 gap-5 w-80 h-80 md:w-md md:h-112">
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
                            className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-4xl bg-arena-dark/80 p-6"
                        >
                            <motion.div
                                initial={{ scale: 0.5, y: 40, filter: 'blur(10px)' }}
                                animate={{ scale: 1, y: 0, filter: 'blur(0px)' }}
                                transition={{ type: "spring", damping: 15 }}
                                className="bg-arena-surface border border-plasma-blue/30 p-10 rounded-3xl shadow-[0_0_50px_rgba(0,212,255,0.2)] text-center w-full max-w-xs relative overflow-hidden"
                            >
                                <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
                                
                                <motion.h3
                                    className={`text-5xl font-black font-orbitron mb-6 italic tracking-tighter relative ${
                                        gameState.winner
                                            ? isWinner
                                                ? "text-plasma-gold drop-shadow-[0_0_15px_#FFD700]"
                                                : "text-plasma-pink glitch-text drop-shadow-[0_0_15px_#FF2D78]"
                                            : "text-slate-400"
                                    }`}
                                    data-text={gameState.winner && !isWinner ? "DEFEATED" : ""}
                                >
                                    {gameState.winner
                                        ? isWinner
                                            ? "VICTORY"
                                            : "DEFEATED"
                                        : "STALEMATE"}
                                </motion.h3>
                                
                                <p className="text-slate-400 mb-10 text-xs font-bold uppercase tracking-[0.2em]">
                                    {gameState.winner
                                        ? `${gameState.winner} dominated the sector`
                                        : "Tactical equilibrium achieved"}
                                </p>

                                <div className="space-y-4 relative z-10">
                                    {/* Play Again Request Pending - Show Accept/Reject */}
                                    {playAgainRequest === "pending" ? (
                                        <>
                                            <motion.p className="text-center text-plasma-purple font-black font-orbitron text-[10px] tracking-widest animate-pulse mb-2 uppercase">
                                                Incoming Rematch Request
                                            </motion.p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <motion.button
                                                    whileHover={{ scale: 1.05, boxShadow: "0 0 15px #00D4FF" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={acceptPlayAgainGame}
                                                    className="py-3 bg-plasma-blue text-arena-dark rounded-xl font-black font-orbitron text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                                                >
                                                    CONFIRM
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05, border: "1px solid #FF2D78" }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={rejectPlayAgainGame}
                                                    className="py-3 bg-arena-dark border border-plasma-pink/50 text-plasma-pink rounded-xl font-black font-orbitron text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all"
                                                >
                                                    DENY
                                                </motion.button>
                                            </div>
                                        </>
                                    ) : playAgainRequest === "requested" ? (
                                        <div className="py-4 border border-plasma-blue/20 rounded-xl bg-plasma-blue/5">
                                            <motion.p 
                                                animate={{ opacity: [0.4, 1, 0.4] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="text-center text-plasma-blue font-black font-orbitron text-[10px] tracking-widest uppercase"
                                            >
                                                📡 Transmitting Signal...
                                            </motion.p>
                                        </div>
                                    ) : playAgainRequest === "accepted" ? (
                                        <div className="py-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                                             <motion.p className="text-center text-green-400 font-black font-orbitron text-[10px] tracking-widest uppercase">
                                                ✅ Synced // Restarting
                                            </motion.p>
                                        </div>
                                    ) : playAgainRequest === "rejected" ? (
                                        <div className="py-4 bg-plasma-pink/10 border border-plasma-pink/30 rounded-xl">
                                            <motion.p className="text-center text-plasma-pink font-black font-orbitron text-[10px] tracking-widest uppercase">❌ Request Denied</motion.p>
                                        </div>
                                    ) : (
                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(0,212,255,0.4)" }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={requestPlayAgainGame}
                                            className="w-full py-4 bg-transparent border-2 border-plasma-blue text-plasma-blue rounded-xl font-black font-orbitron text-xs tracking-[0.3em] uppercase hover:bg-plasma-blue hover:text-arena-dark transition-all"
                                        >
                                            Rematch
                                        </motion.button>
                                    )}
                                    
                                    <button
                                        onClick={handleReturnToLobby}
                                        className="w-full py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black font-orbitron tracking-widest uppercase"
                                    >
                                        Return to HQ
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Turn Status Bar */}
            <motion.div
                animate={
                    isMyTurn && !gameState.gameOver ? { y: [0, -4, 0] } : {}
                }
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-12 w-full max-w-md overflow-hidden relative"
            >
                <div className={`px-8 py-4 bg-arena-mid/80 border rounded-2xl backdrop-blur-md transition-colors duration-500 flex items-center justify-center gap-4 ${
                    isMyTurn && !gameState.gameOver 
                        ? "border-plasma-blue shadow-[0_0_20px_rgba(0,212,255,0.15)]" 
                        : "border-white/5 opacity-60"
                }`}>
                     {isMyTurn && !gameState.gameOver ? (
                        <>
                            <motion.div
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="h-3 w-3 rounded-full bg-plasma-blue shadow-[0_0_10px_#00D4FF]"
                            />
                            <p className="text-xs font-black font-orbitron tracking-[0.3em] text-plasma-blue uppercase -mb-0.5">
                                {activePowerUp
                                    ? `Calibrating ${activePowerUp.replace("_", " ")}`
                                    : "Strike Initiated"}
                            </p>
                        </>
                    ) : gameState.gameOver ? (
                        <p className="text-xs font-black font-orbitron tracking-[0.3em] text-plasma-gold uppercase -mb-0.5">
                            Match Concluded
                        </p>
                    ) : (
                        <>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                className="h-4 w-4 border-2 border-t-transparent border-white/20 rounded-full"
                            />
                            <p className="text-xs font-black font-orbitron tracking-[0.3em] text-slate-500 uppercase -mb-0.5">
                                Opponent Calculating...
                            </p>
                        </>
                    )}
                </div>
            </motion.div>

            {/* Power Ups Chip Bar */}
            {!gameState.gameOver && (
                <motion.div
                    className="mt-8 flex flex-wrap gap-3 justify-center z-10 max-w-3xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {availablePowerUps.map((powerUpObj, idx) => {
                        const powerUp =
                            typeof powerUpObj === "string"
                                ? powerUpObj
                                : powerUpObj.id || powerUpObj.powerupId;
                        const count = powerUpObj.count ?? 1;
                        
                        const config = POWER_UP_CONFIG[powerUp];
                        const pointsForUI = gameState?.rankPoints ?? playerRankPoints ?? 0;
                        const reqRankForUI = config?.unlockRank || "Bronze";
                        const reqPointsForUI = RANK_THRESHOLDS[reqRankForUI] || 0;
                        const isLockedUI = pointsForUI < reqPointsForUI;
                        const isZero = count <= 0;

                        return (
                            <motion.button
                                key={idx}
                                whileHover={!isZero && !isLockedUI ? { scale: 1.05, translateY: -2 } : {}}
                                whileTap={!isZero && !isLockedUI ? { scale: 0.95 } : {}}
                                onClick={() => handlePowerUpClick(powerUp, count)}
                                className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 relative overflow-hidden ${
                                    activePowerUp === powerUp
                                        ? "bg-plasma-purple text-white border-plasma-purple shadow-[0_0_15px_#BF5FFF] scale-105"
                                        : !isZero && !isLockedUI
                                        ? "bg-arena-mid/80 text-plasma-blue border border-plasma-blue/20 hover:border-plasma-blue"
                                        : "bg-arena-surface/40 text-slate-600 border border-white/5 cursor-not-allowed"
                                }`}
                            >
                                <Zap size={14} className={activePowerUp === powerUp ? "text-white" : !isZero && !isLockedUI ? "text-plasma-blue" : "text-slate-700"} />
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-orbitron uppercase tracking-widest">{config.name}</span>
                                    {isLockedUI ? (
                                        <span className="text-[8px] text-plasma-pink uppercase font-bold tracking-tighter">REQ: {reqRankForUI}</span>
                                    ) : (
                                        <span className={`text-[8px] font-black ${isZero ? 'text-slate-500' : 'text-plasma-blue'}`}>QTY: {count}</span>
                                    )}
                                </div>
                                {(isZero || isLockedUI) && <Lock size={12} className="absolute top-1 right-1 opacity-40" />}
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
    </main>
</div>
    );
};

const PlayerCard = ({ name, symbol, isTurn, isSelf }) => (
    <motion.div
        animate={
            isTurn
                ? {
                      scale: 1.05,
                      borderColor: symbol === "X" ? "#00D4FF" : "#BF5FFF",
                      boxShadow: symbol === "X" 
                        ? "0 0 30px rgba(0, 212, 255, 0.3), inset 0 0 15px rgba(0, 212, 255, 0.1)"
                        : "0 0 30px rgba(191, 95, 255, 0.3), inset 0 0 15px rgba(191, 95, 255, 0.1)",
                  }
                : {
                      scale: 1,
                      borderColor: "rgba(255,255,255,0.05)",
                      boxShadow: "none",
                      opacity: 0.6
                  }
        }
        transition={{ duration: 0.4 }}
        className="p-4 rounded-xl border bg-arena-mid/80 backdrop-blur-xl relative overflow-hidden transition-all group font-rajdhani flex-1 w-full md:max-w-70"
    >
        <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />
        
        {isTurn && (
            <motion.div
                className={`absolute inset-0 z-0 opacity-10 ${symbol === "X" ? "bg-plasma-blue" : "bg-plasma-purple"}`}
                animate={{ opacity: [0.05, 0.15, 0.05] }}
                transition={{ repeat: Infinity, duration: 2 }}
            />
        )}

        <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-14 h-14 relative shrink-0 flex items-center justify-center">
                    <div className={`absolute inset-0 ${symbol === "X" ? "text-plasma-blue/20" : "text-plasma-purple/20"}`}>
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
                            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
                        </svg>
                    </div>
                    <div className={`absolute inset-0 ${symbol === "X" ? "text-plasma-blue" : "text-plasma-purple"} opacity-40`}>
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current" strokeWidth="2">
                            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" />
                        </svg>
                    </div>
                    <motion.span
                        animate={isTurn ? { scale: [1, 1.2, 1], filter: symbol === "X" ? "drop-shadow(0 0 8px #00D4FF)" : "drop-shadow(0 0 8px #BF5FFF)" } : {}}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className={`text-2xl font-black font-orbitron z-10 ${
                            symbol === "X" ? "text-plasma-blue" : "text-plasma-purple"
                        }`}
                    >
                        {symbol}
                    </motion.span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black font-orbitron uppercase text-slate-500 tracking-[0.2em] mb-1">
                        {isSelf ? "Cortex Link: 100%" : "Neutral Link: OK"}
                    </p>
                    <h3 className="text-sm font-bold text-white truncate font-orbitron tracking-tight uppercase">
                        {name}
                    </h3>
                </div>
            </div>

            {/* Turn Logic Indicator */}
            <div className="flex items-center justify-center w-6">
                {isTurn ? (
                    <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className={`w-2 h-2 rounded-full ${symbol === "X" ? "bg-plasma-blue shadow-[0_0_10px_#00D4FF]" : "bg-plasma-purple shadow-[0_0_10px_#BF5FFF]"}`}
                    />
                ) : (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="text-slate-700 opacity-40"
                    >
                        <RefreshCcw size={14} />
                    </motion.div>
                )}
            </div>
        </div>

        {isTurn && (
            <div className={`absolute bottom-0 left-0 h-0.5 ${symbol === "X" ? "bg-plasma-blue" : "bg-plasma-purple"} shadow-[0_0_10px_currentColor]`} style={{ width: '100%' }} />
        )}
    </motion.div>
);

export default Game;
