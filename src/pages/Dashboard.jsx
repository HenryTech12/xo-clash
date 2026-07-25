import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGame";
import { LogOut, Play, Zap, Trophy, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { trackService, powerUpService } from "../services/api";
import PowerUpActivationModal from "../components/PowerUpActivationModal";
import PowerUpCard from "../components/PowerUpCard";
import PlayerStatsCard from "../components/PlayerStatsCard";
import Leaderboard from "../components/Leaderboard";
import { POWER_UP_CONFIG } from "../config/powerUpConfig";

const formatQueueTime = (seconds) => {
    const m = Math.floor(seconds / 60)
        .toString()
        .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
};

const IdentitySkeleton = () => (
    <div className="bg-surface/80 border border-surface-2 p-6 rounded-[10px] animate-pulse space-y-6">
        <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-surface-2 rounded-[10px]" />
            <div className="space-y-2 flex-1">
                <div className="h-5 w-32 bg-surface-2 rounded" />
                <div className="h-3 w-24 bg-surface-2 rounded" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
            <div className="h-14 bg-surface-2/60 rounded-[10px]" />
            <div className="h-14 bg-surface-2/60 rounded-[10px]" />
        </div>
    </div>
);

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

    const [unlockedPowerUps, setUnlockedPowerUps] = useState([]);
    const [selectedPowerUp, setSelectedPowerUp] = useState(null);
    const [activatingPowerUp, setActivatingPowerUp] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [loading, setLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [queueStartedAt, setQueueStartedAt] = useState(null);
    const [queueElapsed, setQueueElapsed] = useState(0);
    const [retryTick, setRetryTick] = useState(0);

    useEffect(() => {
      const fetchData = async () => {
        if (!user?.username) return;
        setLoading(true);
        setStatsError(null);

        try {
            const dashResFallback = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/players/${user.username}/stats`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            );
            if (dashResFallback.ok) {
                const data = await dashResFallback.json();
                setDashboardData(data);
                const points = data.rankPoints ?? data.points ?? 0;
                localStorage.setItem("rankPoints", points.toString());
            } else {
                throw new Error("Stats endpoint not OK");
            }
        } catch {
            // Fallback: if the new stats endpoint fails, try the older dashboard data
            try {
                const dashRes = await trackService.getDashboardData(user.username);
                if (dashRes && dashRes.dashboardData) {
                    setDashboardData(dashRes.dashboardData);
                    const points =
                        dashRes.dashboardData.rankPoints ?? dashRes.dashboardData.points ?? 0;
                    localStorage.setItem("rankPoints", points.toString());
                } else {
                    throw new Error("No dashboard data returned");
                }
            } catch (fallbackErr) {
                console.error("Both stats endpoints failed", fallbackErr);
                setStatsError("Couldn't load your stats.");
            }
        }

        try {
            const userPowerupsData = await powerUpService.getPlayerPowerUps(user.username);
            const powerupsList = Array.isArray(userPowerupsData)
                ? userPowerupsData
                : userPowerupsData?.unlockedPowerups || [];
            const unlockedMap = {};
            powerupsList.forEach((up) => {
                // Use powerupName (the plain power-up type, e.g. "HINT") as the
                // key: powerupId is now scoped per-player (e.g. "alice:HINT")
                // and won't match the POWER_UP_CONFIG keys used elsewhere.
                const id = up.powerupName || up.powerupId || up.id;
                unlockedMap[id] = { ...up, id };
            });
            setUnlockedPowerUps(unlockedMap);
        } catch (err) {
            console.log("User power-ups not yet available:", err);
        }

        setLoading(false);
      };
      fetchData();
    }, [user?.username, retryTick]);

    // Queue timer - only ticks once a queueStartedAt timestamp has been set
    // (by the Enter Queue button's click handler, not reactively in here).
    useEffect(() => {
        if (queueStartedAt == null) return;
        const interval = setInterval(() => {
            setQueueElapsed(Math.floor((Date.now() - queueStartedAt) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [queueStartedAt]);

    const handlePowerUpSelect = (powerUp) => {
        setSelectedPowerUp(POWER_UP_CONFIG[powerUp] || null);
    };

    const handlePowerUpActivate = async () => {
        if (!selectedPowerUp) return;

        setActivatingPowerUp(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/powerups/activate`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                    body: JSON.stringify({
                        powerUpType: selectedPowerUp.id,
                        playerId: user.username,
                    }),
                }
            );

            if (response.ok) {
                setSelectedPowerUp(null);
            } else {
                toast.error("Power-ups can only be activated during an active match.");
            }
        } catch (error) {
            console.error("Failed to activate power-up:", error);
            toast.error("Failed to activate power-up. Please try again.");
        } finally {
            setActivatingPowerUp(false);
        }
    };

    return (
        <div className="min-h-screen bg-void p-6 overflow-hidden relative font-rajdhani">
            <div className="fixed inset-0 holo-grid pointer-events-none opacity-20" />
            <div className="fixed inset-0 scanlines pointer-events-none" />

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand blur-[120px] rounded-full"
                />
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.08, 0.05] }}
                    transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-master blur-[120px] rounded-full"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-7xl mx-auto relative z-10"
            >
                {/* Header */}
                <div className="flex justify-between items-end mb-12 border-b border-brand/20 pb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-5xl font-black font-orbitron text-brand drop-shadow-[0_0_10px_#5b6ef5]">XO</h1>
                            <div className="h-8 w-0.5 bg-brand/30 rotate-12" />
                            <h1 className="text-5xl font-black font-orbitron text-master drop-shadow-[0_0_10px_#b98ff0]">CLASH</h1>
                        </div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] ml-1">
                            Command Center // v2.0.4-beta
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        className="flex items-center gap-3 px-6 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-md transition-all font-orbitron font-bold text-[10px] tracking-widest border border-danger/30 uppercase"
                    >
                        Disconnect <LogOut size={16} />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Player Identity */}
                    <div className="lg:col-span-4 space-y-6">
                        {loading ? (
                            <IdentitySkeleton />
                        ) : (
                            <>
                                {statsError && (
                                    <div className="flex items-center justify-between gap-3 rounded-md border border-warn/30 bg-warn/10 px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={14} className="text-warn shrink-0" />
                                            <p className="font-data text-[11px] text-warn">{statsError}</p>
                                        </div>
                                        <button
                                            onClick={() => setRetryTick((t) => t + 1)}
                                            className="font-data text-[10px] uppercase tracking-wider text-warn underline underline-offset-2 shrink-0"
                                        >
                                            Retry
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-5 bg-surface/80 border border-brand/30 p-6 rounded-[10px]">
                                    <div className="relative">
                                        <div className="w-16 h-16 bg-surface-2 border-2 border-brand rounded-[10px] flex items-center justify-center text-3xl font-black font-orbitron text-brand">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-rank-gold text-void text-[10px] font-black px-2 py-1 rounded border border-void uppercase">
                                            Lvl {dashboardData.level || 1}
                                        </div>
                                    </div>
                                    <h2 className="flex-1 min-w-0 text-2xl font-black font-orbitron text-white tracking-widest truncate">
                                        {user?.username}
                                    </h2>
                                </div>

                                <PlayerStatsCard stats={dashboardData} />
                            </>
                        )}

                        {matchmaking ? (
                            <div className="w-full rounded-[10px] border border-brand/30 bg-surface/80 px-5 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="h-2.5 w-2.5 rounded-full bg-brand shrink-0 animate-pulse" />
                                    <div className="min-w-0">
                                        <p className="font-orbitron font-bold text-xs tracking-widest text-brand uppercase truncate">
                                            In Queue
                                        </p>
                                        <p className="font-data text-[11px] text-slate-400 tabular-nums">
                                            {formatQueueTime(queueElapsed)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        cancelMatchmaking();
                                        setQueueStartedAt(null);
                                        setQueueElapsed(0);
                                    }}
                                    className="shrink-0 px-4 py-2 rounded-md border border-danger/40 text-danger font-orbitron font-bold text-[10px] tracking-widest uppercase hover:bg-danger/10 transition-colors"
                                >
                                    Abort
                                </button>
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02, translateY: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setQueueStartedAt(Date.now());
                                    startMatchmaking();
                                }}
                                className="w-full h-16 bg-brand hover:bg-[#6d7ef7] rounded-[10px] font-orbitron font-black text-lg tracking-[0.2em] shadow-lg transition-colors flex items-center justify-center gap-3 text-white"
                            >
                                ENTER QUEUE <Play size={20} fill="currentColor" />
                            </motion.button>
                        )}

                        <button
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            className="w-full py-3 border border-master/30 text-master rounded-[10px] font-orbitron font-bold text-[10px] tracking-[0.3em] uppercase flex items-center justify-center gap-2 hover:bg-master/10 transition-colors"
                        >
                            <Trophy size={16} /> Leaderboard
                        </button>
                    </div>

                    {/* Right Column: Loadout */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3 px-2">
                            <Zap size={20} className="text-brand" />
                            <h3 className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase text-white">Loadout</h3>
                            <div className="flex-1 h-px bg-brand/20" />
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <div key={i} className="h-32 bg-surface/40 border border-white/5 rounded-[10px] animate-pulse" />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {Object.keys(POWER_UP_CONFIG).map((powerUpKey) => {
                                    const unlocked = unlockedPowerUps[powerUpKey];

                                    return (
                                        <PowerUpCard
                                            key={powerUpKey}
                                            powerupType={powerUpKey}
                                            isUnlocked={!!unlocked}
                                            count={unlocked?.count ?? 0}
                                            onActivate={() => handlePowerUpSelect(powerUpKey)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <PowerUpActivationModal
                    powerupConfig={selectedPowerUp}
                    onClose={() => setSelectedPowerUp(null)}
                    onConfirm={handlePowerUpActivate}
                    isLoading={activatingPowerUp}
                />
            </motion.div>

            {/* Leaderboard overlay placed at top-level to avoid stacking context issues */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-void/60"
                        style={{ pointerEvents: "auto" }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="w-full max-w-4xl bg-surface border border-master/30 rounded-[10px] shadow-[0_0_50px_rgba(185,143,240,0.2)] overflow-hidden relative h-[80vh] flex flex-col"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-void/50">
                                <div className="flex items-center gap-3">
                                    <Trophy className="text-rank-gold" size={22} />
                                    <h2 className="text-xl font-black font-orbitron text-white tracking-widest">Leaderboard</h2>
                                </div>
                                <button
                                    onClick={() => setShowLeaderboard(false)}
                                    className="text-slate-500 hover:text-danger p-2 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                <Leaderboard username={user?.username} />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
