import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../hooks/useGame";
import { LogOut, Play, Zap, Trophy, Flame, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
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
                            `${import.meta.env.VITE_API_URL}/api/v1/players/${user.username}/stats`,
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
                            // Store rank points in localStorage for consistency across components
                            const points = data.rankPoints ?? data.points ?? 0;
                            localStorage.setItem(
                                "rankPoints",
                                points.toString()
                            );
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
                                // Store rank points in localStorage for consistency across components
                                const points =
                                    dashRes.dashboardData.rankPoints ??
                                    dashRes.dashboardData.points ??
                                    0;
                                localStorage.setItem(
                                    "rankPoints",
                                    points.toString()
                                );
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
                        // Backend returns a raw array of PlayerPowerUps
                        const powerupsList = Array.isArray(userPowerupsData)
                            ? userPowerupsData
                            : userPowerupsData?.unlockedPowerups || [];
                        // Extract power-up data into a map
                        const unlockedMap = {};
                        powerupsList.forEach((up) => {
                            const id = up.powerupId || up.id;
                            unlockedMap[id] = { ...up, id };
                        });
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
        setSelectedPowerUp(POWER_UP_CONFIG[powerUp] || null);
    };

    const handlePowerUpActivate = async () => {
        if (!selectedPowerUp) return;

        setActivatingPowerUp(true);
        try {
            // Call API to activate power-up
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/powerups/activate`,
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
            } else {
                toast.error(
                    "Power-ups can only be activated during an active match."
                );
            }
        } catch (error) {
            console.error("Failed to activate power-up:", error);
            toast.error("Failed to activate power-up. Please try again.");
        } finally {
            setActivatingPowerUp(false);
        }
    };

    if (matchmaking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-arena-dark p-4 text-center overflow-hidden relative font-rajdhani">
                {/* Holographic Grid floor */}
                <div className="fixed inset-0 holo-grid pointer-events-none opacity-40" />
                <div className="fixed inset-0 scanlines pointer-events-none" />

                {/* Animated Background Orbs */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-plasma-blue/20 blur-[120px] rounded-full"
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6 }}
                    className="bg-arena-mid/90 shadow-[0_0_60px_rgba(0,212,255,0.2)] border border-plasma-blue/30 backdrop-blur-xl p-12 rounded-3xl max-w-md w-full relative z-10"
                    style={{ transform: "perspective(1000px) rotateX(4deg)" }}
                >
                    <div className="relative mb-8 w-24 h-24 mx-auto">
                        <motion.div
                            className="absolute inset-0 bg-plasma-blue/30 rounded-full blur-xl"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-0 border-2 border-dashed border-plasma-blue rounded-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Zap size={48} className="text-plasma-blue drop-shadow-[0_0_10px_#00D4FF]" />
                        </div>
                    </div>

                    <motion.h2
                        className="text-4xl font-black font-orbitron mb-4 text-plasma-blue drop-shadow-[0_0_10px_rgba(0,212,255,0.5)] tracking-tighter"
                    >
                        SCANNING ARENA
                    </motion.h2>
                    <p className="text-slate-400 mb-8 text-sm uppercase tracking-[0.3em] font-bold">
                        Locating Hostile Signals...
                    </p>

                    <div className="flex gap-2 mb-10 overflow-hidden px-4">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ 
                                    scaleY: [0.3, 1, 0.3],
                                    backgroundColor: ['#00D4FF', '#BF5FFF', '#00D4FF']
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.1,
                                }}
                                className="flex-1 h-12 rounded-full opacity-60 shadow-[0_0_10px_currentColor]"
                            />
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,45,120,0.4)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={cancelMatchmaking}
                        className="w-full py-4 bg-transparent border-2 border-plasma-pink text-plasma-pink rounded-xl transition-all font-orbitron font-bold text-xs tracking-widest uppercase hover:bg-plasma-pink hover:text-white"
                    >
                        Abort Protocol
                    </motion.button>
                </motion.div>
            {/* Leaderboard overlay placed at top-level to avoid stacking context issues */}
            <AnimatePresence>
                {showLeaderboard && (
                    <motion.div 
                        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                        className="fixed inset-0 z-99999 flex items-center justify-center p-4 bg-arena-dark/60"
                        style={{ pointerEvents: 'auto' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="w-full max-w-4xl bg-arena-mid border border-plasma-purple/30 rounded-3xl shadow-[0_0_50px_rgba(191,95,255,0.2)] overflow-hidden relative h-[80vh] flex flex-col"
                        >
                            <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
                            
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-arena-dark/50">
                                <div className="flex items-center gap-3">
                                    <Trophy className="text-plasma-gold" size={24} />
                                    <h2 className="text-2xl font-black font-orbitron text-white tracking-widest">GLOBAL STANDINGS</h2>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.1, color: '#FF2D78' }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowLeaderboard(false)}
                                    className="text-slate-500 font-black font-orbitron text-xs tracking-widest uppercase p-2"
                                >
                                    [ CLOSE SIGNAL ]
                                </motion.button>
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
    }

    return (
        <div className="min-h-screen bg-arena-dark p-6 overflow-hidden relative font-rajdhani">
            {/* Holographic grid floor simulation */}
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

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-7xl mx-auto relative z-10"
            >
                {/* Header */}
                <div className="flex justify-between items-end mb-12 border-b border-plasma-blue/20 pb-6">
                    <div>
                         <motion.div className="flex items-center gap-2 mb-1">
                             <motion.h1 
                                className="text-5xl font-black font-orbitron text-plasma-blue drop-shadow-[0_0_10px_#00D4FF]"
                            >XO</motion.h1>
                            <div className="h-8 w-0.5 bg-plasma-blue/30 rotate-12" />
                            <motion.h1 
                                className="text-5xl font-black font-orbitron text-plasma-purple drop-shadow-[0_0_10px_#BF5FFF]"
                            >CLASH</motion.h1>
                        </motion.div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em] ml-1">
                             Command Center // v2.0.4-beta
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.05, x: 5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={logout}
                        className="flex items-center gap-3 px-6 py-2 bg-plasma-pink/10 hover:bg-plasma-pink/20 text-plasma-pink rounded-lg transition-all font-orbitron font-bold text-[10px] tracking-widest border border-plasma-pink/30 uppercase"
                    >
                        Disconnect <LogOut size={16} />
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Player Identity */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div 
                            whileHover={{ rotateY: 5, rotateX: -2, translateZ: 10 }}
                            style={{ perspective: 1000 }}
                            className="bg-arena-mid/80 border border-plasma-blue/30 p-6 rounded-2xl backdrop-blur-xl shadow-[0_0_30px_rgba(0,212,255,0.05)] relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <Trophy size={20} className="text-plasma-gold drop-shadow-[0_0_10px_#FFD700]" />
                            </div>
                            
                            <div className="flex items-center gap-5 mt-4">
                                <div className="relative">
                                    <div className="w-20 h-20 bg-arena-surface border-2 border-plasma-blue rounded-xl flex items-center justify-center text-4xl font-black font-orbitron text-plasma-blue shadow-[0_0_20px_rgba(0,212,255,0.3)]">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <motion.div 
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute -bottom-2 -right-2 bg-plasma-gold text-arena-dark text-[10px] font-black px-2 py-1 rounded border border-arena-dark uppercase"
                                    >
                                        Lvl {dashboardData.level || 1}
                                    </motion.div>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black font-orbitron text-white tracking-widest">
                                        {user?.username}
                                    </h2>
                                    <p className="text-plasma-gold font-bold text-xs uppercase tracking-widest mt-1">
                                         {dashboardData.rank || "Unranked"} Signal
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-8">
                                <div className="bg-arena-dark/50 border border-white/5 p-3 rounded-lg text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Rank Points</p>
                                    <p className="text-xl font-orbitron text-plasma-blue">{dashboardData.rankPoints || 0}</p>
                                </div>
                                <div className="bg-arena-dark/50 border border-white/5 p-3 rounded-lg text-center">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Win Rate</p>
                                    <p className="text-xl font-orbitron text-plasma-purple">{dashboardData.winRate || 0}%</p>
                                </div>
                            </div>
                        </motion.div>

                        <div className="grid grid-cols-3 gap-2">
                             {[
                                { label: 'Wins', value: dashboardData.numOfWins, color: 'text-green-400' },
                                { label: 'Losses', value: dashboardData.numOfLosses, color: 'text-plasma-pink' },
                                { label: 'Stalemates', value: dashboardData.numOfDraws, color: 'text-slate-400' }
                             ].map((stat, i) => (
                                <div key={i} className="bg-arena-mid/30 border border-white/5 p-3 rounded-lg text-center backdrop-blur-sm">
                                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">{stat.label}</p>
                                    <p className={`text-lg font-orbitron ${stat.color}`}>{stat.value}</p>
                                </div>
                             ))}
                        </div>

                         <motion.button
                            whileHover={{ scale: 1.02, translateY: -2, boxShadow: "0 0 40px rgba(0,212,255,0.4)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startMatchmaking()}
                            className="w-full h-20 hero-plasma-glow p-0.5 rounded-2xl font-orbitron font-black text-xl tracking-[0.3em] mt-4 shadow-2xl transition-all"
                        >
                            <div className="bg-arena-dark hover:bg-transparent transition-all w-full h-full rounded-[14px] flex items-center justify-center gap-3 relative z-10 text-white">
                                ENTER THE ARENA <Play size={24} fill="currentColor" />
                            </div>
                        </motion.button>
                        
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: 'rgba(191, 95, 255, 0.1)' }}
                            onClick={() => setShowLeaderboard(!showLeaderboard)}
                            className="w-full py-4 border border-plasma-purple/30 text-plasma-purple rounded-xl font-orbitron font-bold text-[10px] tracking-[0.3em] uppercase flex items-center justify-center gap-2"
                        >
                            <Trophy size={16} /> Global Standings
                        </motion.button>
                    </div>

                    {/* Right Column: Tactical Power-ups */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="flex items-center gap-3 px-2">
                            <Zap size={20} className="text-plasma-blue" />
                            <h3 className="font-orbitron font-bold text-sm tracking-[0.2em] uppercase text-white">Tactical Loadout</h3>
                            <div className="flex-1 h-px bg-plasma-blue/20" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Object.keys(POWER_UP_CONFIG).map((powerUpKey) => {
                                const config = POWER_UP_CONFIG[powerUpKey];
                                const unlocked = unlockedPowerUps[powerUpKey];
                                const isAvailable = availablePowerUps.includes(powerUpKey);
                                
                                return (
                                    <motion.div
                                        key={powerUpKey}
                                        whileHover={{ rotateY: 8, rotateX: -4, translateZ: 15, scale: 1.03 }}
                                        style={{ transformPerspective: 800 }}
                                        onClick={() => handlePowerUpSelect(powerUpKey)}
                                        className={`cursor-pointer p-5 rounded-2xl border transition-all relative overflow-hidden group ${
                                            unlocked 
                                                ? 'bg-arena-mid/80 border-plasma-blue/20 hover:border-plasma-blue shadow-[0_0_20px_rgba(0,212,255,0.05)]' 
                                                : 'bg-arena-surface/40 border-white/5 opacity-60 grayscale'
                                        }`}
                                    >
                                        {!unlocked && (
                                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-arena-dark/60 backdrop-blur-sm">
                                                <Lock size={24} className="text-slate-500 mb-2" />
                                                <p className="text-[10px] font-black font-orbitron uppercase text-slate-400">Locked</p>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="p-3 bg-arena-dark rounded-xl border border-white/5 group-hover:border-plasma-blue/50 transition-colors">
                                                <Zap size={20} className={unlocked ? "text-plasma-blue" : "text-slate-600"} />
                                            </div>
                                            {unlocked && (
                                                <div className="bg-plasma-blue/20 text-plasma-blue text-[10px] font-black px-2 py-1 rounded">
                                                    x{unlocked.count ?? 0}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <h4 className="font-orbitron font-bold text-xs tracking-wider mb-2 text-white">
                                            {config.name}
                                        </h4>
                                        <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-2">
                                            {config.description}
                                        </p>
                                        
                                        {unlocked && (
                                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-plasma-blue opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_#00D4FF]" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                
                
                <PowerUpActivationModal
                    powerupConfig={selectedPowerUp}
                    onClose={() => setSelectedPowerUp(null)}
                    onConfirm={handlePowerUpActivate}
                    isLoading={activatingPowerUp}
                />
            </motion.div>
        </div>
    );
};

export default Dashboard;
