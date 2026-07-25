import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { powerUpService } from "../services/api";
import {
    Trophy,
    Crown,
    Flame,
    TrendingUp,
    Search,
    RefreshCw,
} from "lucide-react";

const RANK_ICONS = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
};

const RANK_COLORS = {
    1: "from-yellow-400 to-yellow-600",
    2: "from-gray-300 to-gray-500",
    3: "from-orange-300 to-orange-600",
};

const Leaderboard = ({ username }) => {
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playerRank, setPlayerRank] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchRankings = async () => {
        setLoading(true);
        try {
            const data = await powerUpService.getRankings(10);
            const rankingsData = data.rankings || data || []; // Handle both {rankings: []} and [] formats

            // Sort by rankPoints in descending order
            const sortedRankings = [...rankingsData].sort((a, b) => {
                const aPoints = a.rankPoints ?? a.points ?? 0;
                const bPoints = b.rankPoints ?? b.points ?? 0;
                return bPoints - aPoints;
            });

            setRankings(sortedRankings);

            // Find current player's position in the leaderboard
            const currentPlayerIndex = sortedRankings.findIndex(
                (r) => (r.username || r.playerId || r.id) === username
            );
            setPlayerRank(
                currentPlayerIndex >= 0
                    ? {
                          ...sortedRankings[currentPlayerIndex],
                          position: currentPlayerIndex + 1,
                      }
                    : null
            );
        } catch (error) {
            console.error("Failed to fetch rankings:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRankings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredRankings = rankings.filter((rank) =>
        String(rank.username || rank.playerId || rank.id || "")
            .toLowerCase()
            .includes((searchQuery || "").toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3 },
        },
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl bg-surface/95 backdrop-blur-2xl rounded-2xl border border-brand/20 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] font-rajdhani"
        >
            <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />
            
            {/* Header */}
            <div className="bg-void px-8 py-8 border-b border-brand/20 relative overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-r from-brand/5 to-transparent pointer-events-none" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-brand/10 rounded-xl border border-brand/30 shadow-[0_0_15px_rgba(91, 110, 245,0.2)]">
                            <Trophy size={32} className="text-brand" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black font-orbitron text-white tracking-tighter">
                                SECTOR RANKINGS
                            </h2>
                            <p className="text-[10px] font-black font-orbitron text-brand tracking-[0.4em] uppercase">
                                Global Tactical Standings
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ rotate: 180, scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={fetchRankings}
                        disabled={loading}
                        className="p-3 bg-surface-2 border border-white/10 hover:border-brand/50 rounded-xl transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={20} className="text-brand" />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand/40"
                    />
                    <input
                        type="text"
                        placeholder="SEARCH COMBATANT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-void/50 border border-brand/20 rounded-xl text-white font-orbitron text-xs tracking-widest placeholder-slate-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all"
                    />
                </div>
            </div>

            {/* Current Player Status Bar */}
            {playerRank && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-brand/10 border-b border-brand/20 px-8 py-4 flex items-center gap-6 relative"
                >
                    <div className="absolute inset-0 scanlines opacity-5 pointer-events-none" />
                    <div className="h-10 w-10 rounded-lg bg-void border border-brand/30 flex items-center justify-center font-orbitron font-black text-brand">
                        #{playerRank.position}
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-brand/60 uppercase tracking-widest mb-0.5">Your Current Standing</p>
                        <p className="text-xl font-black text-white font-orbitron">
                            {playerRank.username?.toUpperCase()}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-rank-gold font-orbitron drop-shadow-[0_0_10px_#e8b84b]">
                            {playerRank.rankPoints}
                        </p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Combat Points</p>
                    </div>
                </motion.div>
            )}

            {/* Rankings List */}
            <div className="overflow-y-auto max-h-112.5 p-4 bg-void/30">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <motion.div
                            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-12 h-12 border-2 border-dashed border-brand rounded-full"
                        />
                        <p className="text-[10px] font-black font-orbitron text-brand tracking-[0.3em] animate-pulse">
                            DOWNLOADING DATA...
                        </p>
                    </div>
                ) : filteredRankings.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                    >
                        {filteredRankings.map((rankObj, index) => {
                            const position = index + 1;
                            const isTop3 = position <= 3;
                            const currUsername = rankObj.username || rankObj.playerId || rankObj.id || "Unknown";
                            const isMe = currUsername === username;

                            return (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ x: 10, backgroundColor: 'rgba(91, 110, 245, 0.05)' }}
                                    className={`px-6 py-4 rounded-xl border flex items-center gap-6 transition-all group ${
                                        isMe 
                                            ? 'bg-brand/10 border-brand/40 shadow-[0_0_20px_rgba(91, 110, 245,0.1)]' 
                                            : 'bg-surface/40 border-white/5 hover:border-brand/20'
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-orbitron font-black text-sm relative ${
                                        position === 1 ? 'bg-rank-gold/20 text-rank-gold border border-rank-gold/40 shadow-[0_0_10px_#e8b84b]' :
                                        position === 2 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                                        position === 3 ? 'bg-orange-400/20 text-orange-400 border border-orange-400/40' :
                                        'bg-void border border-white/5 text-slate-500'
                                    }`}>
                                        {position}
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-orbitron font-bold tracking-wider ${isMe ? 'text-brand' : 'text-slate-200'}`}>
                                                {currUsername.toUpperCase()}
                                            </p>
                                            {isMe && <span className="text-[8px] bg-brand text-void px-1.5 py-0.5 rounded font-black">YOU</span>}
                                        </div>
                                        <div className="flex gap-4 mt-1 opacity-60">
                                            <span className="text-[10px] text-slate-500">W: <span className="text-green-400 font-bold">{rankObj.numOfWins || 0}</span></span>
                                            <span className="text-[10px] text-slate-500">L: <span className="text-danger font-bold">{rankObj.numOfLosses || 0}</span></span>
                                            <span className="text-[10px] text-slate-500">WR: <span className="text-white font-bold">{rankObj.winRate || 0}%</span></span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-xl font-black font-orbitron ${isTop3 ? 'text-rank-gold' : 'text-brand/80'}`}>
                                            {rankObj.rankPoints || 0}
                                        </p>
                                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Points</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-500 font-orbitron text-xs tracking-widest uppercase">No combatants found in this sector</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Leaderboard;
