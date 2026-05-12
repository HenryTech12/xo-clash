import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGame";
import { LogOut, Play, Zap, Trophy, Flame, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { trackService, powerUpService } from "../services/api";
import PlayerStatsCard from "../components/PlayerStatsCard";
import PowerUpCard from "../components/PowerUpCard";
import PowerUpActivationModal from "../components/PowerUpActivationModal";
import Leaderboard from "../components/Leaderboard";
import { POWER_UP_CONFIG } from "../config/powerUpConfig";

const Dashboard = () => {
    const { user, logout } = useAuth();
    const { startMatchmaking, matchmaking, cancelMatchmaking } = useGame();
    const [dashboardData, setDashboardData] = useState({
        numOfWins: 0,
        numOfLosses: 0,
        numOfDraws: 0,
        winRate: 0,
        rank: "Unranked",
        level: 1,
        rankPoints: 0,
    });

    const [playerStats, setPlayerStats] = useState(null);
    const [availablePowerUps, setAvailablePowerUps] = useState([]);
    const [unlockedPowerUps, setUnlockedPowerUps] = useState([]);
    const [selectedPowerUp, setSelectedPowerUp] = useState(null);
    const [activatingPowerUp, setActivatingPowerUp] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (user?.username) {
                try {
                    // Fetch main dashboard data
                    try {
                        const dashResFallback = await fetch(
                            `https://xo-clash-tad8.onrender.com/api/v1/players/${user.username}/stats`,
                            {
                                headers: {
                                    Authorization: `Bearer ${localStorage.getItem(
                                        "token"
                                    )}`,
                                },
                            }
                        );
                        if (dashResFallback.ok) {
                            const data = await dashResFallback.json();
                            setDashboardData(data);
                            setPlayerStats(data);
                        } else {
                            throw new Error("Stats endpoint not OK");
                        }
                    } catch (e) {
                        // Fallback: If new stats endpoint fails, try older dashboard data
                        try {
                            const dashRes = await trackService.getDashboardData(
                                user.username
                            );
                            if (dashRes && dashRes.dashboardData) {
                                setDashboardData(dashRes.dashboardData);
                                setPlayerStats(dashRes.dashboardData);
                            }
                        } catch (fallbackErr) {
                            console.error(
                                "Both stats endpoints failed",
                                fallbackErr
                            );
                        }
                    }

                    // Fetch available power-ups from backend
                    try {
                        const allPowerUps =
                            await powerUpService.getAvailablePowerUps();
                        setAvailablePowerUps(allPowerUps);
                    } catch (err) {
                        console.error("Failed to fetch power-ups:", err);
                        // Fallback to config keys if API fails
                        setAvailablePowerUps(Object.keys(POWER_UP_CONFIG));
                    }

                    // Fetch player's unlocked power-ups from backend
                    try {
                        const userPowerupsData =
                            await powerUpService.getPlayerPowerUps(
                                user.username
                            );
                        // Extract power-up data into a map
                        const unlockedMap = {};
                        (userPowerupsData.unlockedPowerups || []).forEach(
                            (up) => {
                                const id = up.powerupId || up.id;
                                unlockedMap[id] = { ...up, id };
                            }
                        );
                        setUnlockedPowerUps(unlockedMap);
                    } catch (err) {
                        console.log("User power-ups not yet available:", err);
                    }
                } catch (err) {
                    console.error("Failed to fetch dashboard data:", err);
                }
            }
        };

        fetchData();
    }, [user?.username]);

    const handlePowerUpSelect = (powerUp) => {
        setSelectedPowerUp(powerUp);
    };

    const handlePowerUpActivate = async () => {
        if (!selectedPowerUp) return;

        setActivatingPowerUp(true);
        try {
            // Call API to activate power-up
            const response = await fetch(
                "https://xo-clash-tad8.onrender.com/api/v1/powerups/activate",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                    body: JSON.stringify({
                        powerUpType: selectedPowerUp.id,
                        playerId: user.username,
                    }),
                }
            );

            if (response.ok) {
                console.log(`Power-up ${selectedPowerUp.name} activated!`);
                setSelectedPowerUp(null);
            }
        } catch (error) {
            console.error("Failed to activate power-up:", error);
        } finally {
            setActivatingPowerUp(false);
        }
    };

    if (matchmaking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-xo p-4 text-center overflow-hidden relative">
                {/* Animated Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute inset-0 bg-blue-500/10 blur-[120px]"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="bg-slate-900/90 shadow-2xl border border-slate-800/50 backdrop-blur-xl p-12 rounded-3xl max-w-md w-full relative z-10"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="relative mb-8 w-20 h-20 mx-auto"
                    >
                        <motion.div
                            className="absolute inset-0 bg-linear-to-r from-blue-500 to-purple-500 rounded-full blur-lg opacity-50"
                            animate={{
                                scale: [0.8, 1.2, 0.8],
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <Zap
                            size={64}
                            className="text-blue-400 relative z-10"
                        />
                    </motion.div>

                    <motion.h2
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        className="text-4xl font-black mb-4 text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 italic"
                    >
                        SCANNING ARENA
                    </motion.h2>
                    <motion.p
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-slate-400 mb-8 text-lg font-medium"
                    >
                        Searching for a worthy opponent...
                    </motion.p>

                    <div className="flex gap-3 mb-6">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ scaleY: [0.5, 1, 0.5] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1,
                                    delay: i * 0.15,
                                }}
                                className="flex-1 h-10 bg-linear-to-t from-blue-500 to-purple-500 rounded-lg"
                            />
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cancelMatchmaking}
                        className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 rounded-lg transition-all font-bold shadow-lg"
                    >
                        Cancel Search
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" },
        },
    };

    return (
        <div className="min-h-screen bg-gradient-xo p-6 overflow-hidden relative">
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

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-5xl mx-auto relative z-10"
            >
                {/* Header */}
                <motion.div
                    variants={itemVariants}
                    className="flex justify-between items-center mb-12"
                >
                    <div>
                        <motion.h1 className="text-5xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-500 mb-2">
                            XO CLASH
                        </motion.h1>
                        <p className="text-slate-400 text-lg italic">
                            ⚔️ The Ultimate Tic-Tac-Toe Arena
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 hover:bg-red-900/40 text-slate-300 hover:text-red-400 rounded-xl transition-all font-bold border border-slate-700/50 shadow-lg"
                    >
                        <LogOut size={20} />
                        Logout
                    </motion.button>
                </motion.div>

                {/* Welcome Card */}
                <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-8 rounded-3xl mb-10 flex items-center gap-6 backdrop-blur-xl shadow-xl"
                >
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-24 h-24 bg-linear-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg shadow-blue-500/30"
                    >
                        {user?.username?.charAt(0).toUpperCase()}
                    </motion.div>
                    <div className="flex-1">
                        <motion.h2 className="text-3xl font-black text-white mb-2">
                            Welcome back, Champion!
                        </motion.h2>
                        <motion.p className="text-blue-300 italic text-lg font-semibold">
                            @{user?.username}
                        </motion.p>
                        <motion.div className="flex gap-4 mt-3">
                            <div className="flex items-center gap-2">
                                <Trophy size={18} className="text-yellow-400" />
                                <span className="text-slate-400">
                                    {dashboardData.rank || "Unranked"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Flame size={18} className="text-orange-400" />
                                <span className="text-slate-400">
                                    {dashboardData.numOfWins > 0
                                        ? "On Fire!"
                                        : "Ready to start"}
                                </span>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Action Grid */}
                <motion.div className="grid md:grid-cols-2 gap-8">
                    <motion.button
                        variants={itemVariants}
                        whileHover={{
                            scale: 1.05,
                            boxShadow:
                                "0 0 40px rgba(59, 130, 246, 0.4), 0 0 80px rgba(168, 85, 247, 0.2)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startMatchmaking}
                        className="group relative bg-linear-to-br from-blue-600 to-indigo-700 p-10 rounded-3xl text-left overflow-hidden shadow-2xl shadow-blue-500/20 border border-blue-500/20 hover:border-blue-400/50 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Play size={140} />
                        </div>

                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative z-10"
                        >
                            <Play className="mb-4 text-blue-200" size={40} />
                            <h3 className="text-3xl font-black mb-3 text-white">
                                Play Ranked
                            </h3>
                            <p className="text-blue-100/80 text-lg font-medium">
                                Challenge an opponent and prove your tactical
                                mastery
                            </p>
                        </motion.div>

                        <motion.div
                            className="absolute top-4 right-4 px-4 py-2 bg-blue-500/30 rounded-full backdrop-blur-md border border-blue-400/50"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <span className="text-blue-200 font-bold text-sm">
                                LIVE
                            </span>
                        </motion.div>
                    </motion.button>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{
                            scale: 1.05,
                            boxShadow:
                                "0 0 40px rgba(168, 85, 247, 0.4), 0 0 80px rgba(59, 130, 246, 0.2)",
                        }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowLeaderboard(!showLeaderboard)}
                        className="group relative bg-linear-to-br from-purple-600 to-pink-700 p-10 rounded-3xl text-left overflow-hidden shadow-2xl shadow-purple-500/20 border border-purple-500/20 hover:border-purple-400/50 transition-all"
                    >
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy size={140} />
                        </div>

                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="relative z-10"
                        >
                            <Trophy
                                className="mb-4 text-purple-200"
                                size={40}
                            />
                            <h3 className="text-3xl font-black mb-3 text-white">
                                Leaderboard
                            </h3>
                            <p className="text-purple-100/80 text-lg font-medium">
                                Check global rankings and climb the ladder
                            </p>
                        </motion.div>

                        <motion.div
                            className="absolute top-4 right-4 px-4 py-2 bg-purple-500/30 rounded-full backdrop-blur-md border border-purple-400/50"
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <span className="text-purple-200 font-bold text-sm">
                                ACTIVE
                            </span>
                        </motion.div>
                    </motion.button>
                </motion.div>

                {/* Leaderboard View */}
                {showLeaderboard && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        variants={itemVariants}
                        className="mt-12"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-white">
                                🏆 Global Rankings
                            </h2>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowLeaderboard(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition"
                            >
                                Close
                            </motion.button>
                        </div>
                        <Leaderboard username={user?.username} />
                    </motion.div>
                )}
            </motion.div>

            {/* Main Content (shown when not viewing leaderboard) */}
            {!showLeaderboard && (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-5xl mx-auto relative z-10 w-full"
                >
                    {/* Player Stats Card */}
                    <motion.div variants={itemVariants} className="mt-12">
                        <h2 className="text-2xl font-black text-white mb-6">
                            📊 Your Stats
                        </h2>
                        <PlayerStatsCard stats={playerStats} />
                    </motion.div>

                    {/* Power-ups Section */}
                    <motion.div variants={itemVariants} className="mt-12">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-black text-white">
                                ⚡ Power-ups Arsenal
                            </h2>
                            <span className="text-sm text-slate-400">
                                {Object.keys(unlockedPowerUps).length} Unlocked
                            </span>
                        </div>

                        {availablePowerUps.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {availablePowerUps.map((powerup) => {
                                    // availablePowerUps is now an array of objects
                                    const powerupId =
                                        typeof powerup === "string"
                                            ? powerup
                                            : powerup.id;
                                    const powerUpData =
                                        unlockedPowerUps[powerupId];
                                    const isUnlocked = !!powerUpData;
                                    return (
                                        <PowerUpCard
                                            key={powerupId}
                                            powerupType={powerupId}
                                            isUnlocked={isUnlocked}
                                            count={
                                                powerUpData
                                                    ? powerUpData.count
                                                    : 0
                                            }
                                            isActive={
                                                selectedPowerUp?.id ===
                                                powerupId
                                            }
                                            onActivate={handlePowerUpSelect}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-slate-800/40 border border-slate-700/50 p-12 rounded-2xl text-center"
                            >
                                <Zap
                                    size={48}
                                    className="mx-auto text-slate-600 mb-4"
                                />
                                <p className="text-slate-400">
                                    Power-ups system loading...
                                </p>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Stats Footer */}
                    <motion.div
                        variants={itemVariants}
                        className="mt-12 grid grid-cols-3 gap-4 text-center"
                    >
                        {[
                            {
                                label: "Matches",
                                value:
                                    (dashboardData.totalWins ??
                                        dashboardData.numOfWins ??
                                        0) +
                                    (dashboardData.totalLosses ??
                                        dashboardData.numOfLosses ??
                                        0) +
                                    (dashboardData.totalDraws ??
                                        dashboardData.numOfDraws ??
                                        0),
                            },
                            {
                                label: "Wins",
                                value:
                                    dashboardData.totalWins ??
                                    dashboardData.numOfWins ??
                                    0,
                            },
                            {
                                label: "Winrate",
                                value: (() => {
                                    const w =
                                        dashboardData.totalWins ??
                                        dashboardData.numOfWins ??
                                        0;
                                    const l =
                                        dashboardData.totalLosses ??
                                        dashboardData.numOfLosses ??
                                        0;
                                    const total = w + l;

                                    // Some backend APIs send winRate as 0.75, some send numeric, some don't send it.
                                    // We'll calculate it manually to be safe.
                                    const rate =
                                        total > 0 ? (w / total) * 100 : 0;
                                    return `${rate.toFixed(1)}%`;
                                })(),
                            },
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.05 }}
                                className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-xl backdrop-blur-sm"
                            >
                                <p className="text-2xl font-black text-blue-400 mb-1">
                                    {stat.value}
                                </p>
                                <p className="text-slate-400 font-medium">
                                    {stat.label}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>
            )}

            {/* Power-up Activation Modal */}
            <PowerUpActivationModal
                powerup={selectedPowerUp}
                onClose={() => setSelectedPowerUp(null)}
                onConfirm={handlePowerUpActivate}
                isLoading={activatingPowerUp}
            />
        </div>
    );
};

export default Dashboard;
