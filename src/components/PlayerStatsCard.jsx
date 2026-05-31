import React from "react";
import {
    Trophy,
    TrendingUp,
    TrendingDown,
    Target,
    Crown,
    Zap,
} from "lucide-react";
import { motion } from "framer-motion";

const PlayerStatsCard = ({ stats }) => {
    if (!stats) {
        return (
            <div className="bg-slate-700/40 rounded-lg p-4 animate-pulse">
                <div className="h-32 bg-slate-600 rounded"></div>
            </div>
        );
    }

    // Determine rank color and icon
    const getRankInfo = (rank) => {
        const safeRank = rank
            ? rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase()
            : "Bronze";

        const rankMap = {
            Bronze: { color: "from-amber-700/20 to-amber-900/40", plasma: "text-amber-500", glow: "shadow-amber-500/20", icon: "🥉" },
            Silver: { color: "from-slate-400/20 to-slate-600/40", plasma: "text-slate-300", glow: "shadow-slate-300/20", icon: "🥈" },
            Gold: { color: "from-plasma-gold/20 to-plasma-gold/40", plasma: "text-plasma-gold", glow: "shadow-plasma-gold/20", icon: "🥇" },
            Platinum: { color: "from-plasma-blue/20 to-plasma-blue/40", plasma: "text-plasma-blue", glow: "shadow-plasma-blue/20", icon: "💎" },
            Diamond: { color: "from-plasma-purple/20 to-plasma-purple/40", plasma: "text-plasma-purple", glow: "shadow-plasma-purple/20", icon: "👑" },
            Legend: { color: "from-plasma-pink/20 to-plasma-pink/40", plasma: "text-plasma-pink", glow: "shadow-plasma-pink/20", icon: "⭐" },
        };
        return rankMap[safeRank] || rankMap["Bronze"];
    };

    const rankInfo = getRankInfo(stats.rank);

    // Support varying data structures from different API models
    const wins = stats.totalWins ?? stats.numOfWins ?? 0;
    const losses = stats.totalLosses ?? stats.numOfLosses ?? 0;
    const draws = stats.totalDraws ?? stats.numOfDraws ?? 0;
    const points = stats.rankPoints ?? stats.points ?? 0;

    const winRate =
        wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-arena-mid/90 backdrop-blur-xl shadow-2xl font-rajdhani"
        >
            <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" />
            
            {/* Background gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${rankInfo.color} opacity-30`} />

            {/* Content */}
            <div className="relative z-10 p-6">
                {/* Header with rank */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black font-orbitron text-slate-500 uppercase tracking-[0.4em] mb-1">
                            Current Standing
                        </p>
                        <h3 className={`text-4xl font-black font-orbitron tracking-tighter ${rankInfo.plasma} drop-shadow-[0_0_10px_currentColor]`}>
                            {stats.rank?.toUpperCase() || "BRONZE"}
                        </h3>
                    </div>
                    <motion.div
                        animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className={`text-5xl p-4 rounded-xl bg-arena-dark border border-white/10 shadow-xl ${rankInfo.glow}`}
                    >
                        {rankInfo.icon}
                    </motion.div>
                </div>

                {/* Technical points readout */}
                <div className="bg-arena-dark/80 border border-white/5 rounded-xl p-5 mb-8 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Crown size={40} className={rankInfo.plasma} /></div>
                    <p className="text-[9px] font-black font-orbitron text-slate-600 uppercase tracking-widest mb-1">
                        Combat Points Accumulation
                    </p>
                    <div className="flex items-end gap-2">
                        <span className={`text-4xl font-black font-orbitron ${rankInfo.plasma}`}>{points}</span>
                        <span className="text-xs font-bold text-slate-500 mb-1.5 uppercase">CP</span>
                    </div>
                    
                    {/* Fake progress bar */}
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(points % 100)}%` }} // Just for visual
                            className={`h-full bg-linear-to-r from-transparent via-current to-transparent ${rankInfo.plasma}`}
                        />
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-500/10 rounded-lg border border-green-500/20">
                                <TrendingUp size={16} className="text-green-400" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Victories</p>
                                <p className="text-xl font-black font-orbitron text-green-400">{wins}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-plasma-pink/10 rounded-lg border border-plasma-pink/20">
                                <TrendingDown size={16} className="text-plasma-pink" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Defeats</p>
                                <p className="text-xl font-black font-orbitron text-plasma-pink">{losses}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-area-dark/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center relative group">
                        <Target size={40} className="absolute opacity-5 text-plasma-blue group-hover:scale-150 transition-transform duration-1000" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Success Rate</p>
                        <div className="relative">
                            <svg viewBox="0 0 100 100" className="w-20 h-20">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <motion.circle 
                                    cx="50" cy="50" r="45" fill="none" stroke="#00D4FF" strokeWidth="8"
                                    strokeDasharray="283"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{ strokeDashoffset: 283 - (283 * winRate) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-black font-orbitron text-white">{winRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerStatsCard;
