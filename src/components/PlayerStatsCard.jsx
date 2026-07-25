import React from "react";
import { TrendingUp, TrendingDown, Target, Medal, Gem, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { RANK_THRESHOLDS } from "../config/powerUpConfig";

const RANK_ORDER = Object.keys(RANK_THRESHOLDS);

const RANK_STYLES = {
    Bronze: { icon: Medal, color: "text-orange-700" },
    Silver: { icon: Medal, color: "text-slate-300" },
    Gold: { icon: Medal, color: "text-rank-gold" },
    Platinum: { icon: Gem, color: "text-teal-300" },
    Diamond: { icon: Gem, color: "text-sky-300" },
    Master: { icon: Crown, color: "text-master" },
    Grandmaster: { icon: Crown, color: "text-danger" },
};

const normalizeRank = (rank) =>
    rank ? rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase() : "Bronze";

// Real progress toward the next rank threshold, not a cosmetic placeholder.
const getRankProgress = (rank, points) => {
    const safeRank = normalizeRank(rank);
    const idx = RANK_ORDER.indexOf(safeRank);
    if (idx === -1 || idx === RANK_ORDER.length - 1) {
        return { percent: 100, nextRank: null };
    }
    const currentThreshold = RANK_THRESHOLDS[safeRank];
    const nextRank = RANK_ORDER[idx + 1];
    const nextThreshold = RANK_THRESHOLDS[nextRank];
    const span = nextThreshold - currentThreshold;
    const percent = span > 0 ? Math.max(0, Math.min(100, ((points - currentThreshold) / span) * 100)) : 100;
    return { percent, nextRank };
};

const PlayerStatsCard = ({ stats }) => {
    if (!stats) {
        return (
            <div className="bg-surface/40 rounded-[10px] p-6 animate-pulse">
                <div className="h-32 bg-surface-2 rounded-md" />
            </div>
        );
    }

    const safeRank = normalizeRank(stats.rank);
    const rankStyle = RANK_STYLES[safeRank] || RANK_STYLES.Bronze;
    const RankIcon = rankStyle.icon;

    const wins = stats.totalWins ?? stats.numOfWins ?? 0;
    const losses = stats.totalLosses ?? stats.numOfLosses ?? 0;
    const points = stats.rankPoints ?? stats.points ?? 0;

    const winRate =
        wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;
    const { percent: rankProgress, nextRank } = getRankProgress(stats.rank, points);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[10px] border border-white/10 bg-surface/90 backdrop-blur-xl font-rajdhani"
        >
            <div className="p-6">
                {/* Header with rank */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <p className="text-[10px] font-black font-orbitron text-slate-500 uppercase tracking-[0.4em] mb-1">
                            Current Standing
                        </p>
                        <h3 className={`text-4xl font-black font-orbitron tracking-tighter ${rankStyle.color}`}>
                            {safeRank.toUpperCase()}
                        </h3>
                    </div>
                    <div className="p-4 rounded-md bg-void border border-white/10">
                        <RankIcon size={32} className={rankStyle.color} />
                    </div>
                </div>

                {/* Rank points + progress to next rank */}
                <div className="bg-void/80 border border-white/5 rounded-md p-5 mb-8">
                    <p className="text-[9px] font-black font-orbitron text-slate-600 uppercase tracking-widest mb-1">
                        Rank Points
                    </p>
                    <div className="flex items-end gap-2 mb-4">
                        <span className={`text-4xl font-black font-data ${rankStyle.color}`}>{points}</span>
                        <span className="text-xs font-bold text-slate-500 mb-1.5 uppercase">RP</span>
                    </div>

                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${rankProgress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={`h-full ${rankStyle.color.replace("text-", "bg-")}`}
                        />
                    </div>
                    <p className="mt-2 text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                        {nextRank ? `${Math.round(rankProgress)}% to ${nextRank}` : "Max rank reached"}
                    </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-live/10 rounded-md border border-live/20">
                                <TrendingUp size={16} className="text-live" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Wins</p>
                                <p className="text-xl font-black font-data text-live">{wins}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-danger/10 rounded-md border border-danger/20">
                                <TrendingDown size={16} className="text-danger" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider">Losses</p>
                                <p className="text-xl font-black font-data text-danger">{losses}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-void/40 border border-white/5 rounded-md p-4 flex flex-col items-center justify-center relative">
                        <Target size={40} className="absolute opacity-5 text-brand" />
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Rate</p>
                        <div className="relative">
                            <svg viewBox="0 0 100 100" className="w-20 h-20">
                                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                <motion.circle
                                    cx="50" cy="50" r="45" fill="none" stroke="#5b6ef5" strokeWidth="8"
                                    strokeDasharray="283"
                                    initial={{ strokeDashoffset: 283 }}
                                    animate={{ strokeDashoffset: 283 - (283 * winRate) / 100 }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-black font-data text-white">{winRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerStatsCard;
