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
        // Convert to Title Case for safety (e.g. "BRONZE" -> "Bronze")
        const safeRank = rank
            ? rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase()
            : "Bronze";

        const rankMap = {
            Bronze: { color: "from-amber-700 to-amber-900", icon: "🥉" },
            Silver: { color: "from-gray-400 to-gray-600", icon: "🥈" },
            Gold: { color: "from-yellow-400 to-yellow-600", icon: "🥇" },
            Platinum: { color: "from-blue-300 to-cyan-500", icon: "💎" },
            Diamond: { color: "from-purple-400 to-purple-600", icon: "👑" },
            Legend: { color: "from-red-400 to-orange-600", icon: "⭐" },
        };
        return rankMap[safeRank] || rankMap["Bronze"];
    };

    const rankInfo = getRankInfo(stats.rank);

    // Support varying data structures from different API models
    const wins = stats.totalWins ?? stats.numOfWins ?? 0;
    const losses = stats.totalLosses ?? stats.numOfLosses ?? 0;
    const draws = stats.totalDraws ?? stats.numOfDraws ?? 0;
    const points = stats.rankPoints ?? stats.points ?? 0;
    const experience = stats.experience ?? stats.xp ?? 0;

    const winRate =
        wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl"
        >
            {/* Background gradient */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${rankInfo.color} opacity-10`}
            />

            {/* Animated background effects */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className={`absolute inset-0 bg-gradient-to-br ${rankInfo.color} opacity-5`}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-slate-900/80" />

            {/* Content */}
            <div className="relative z-10 p-6">
                {/* Header with rank */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 mb-1">
                            Player Rank
                        </h3>
                        <p className="text-4xl font-black text-white">
                            {stats.rank
                                ? stats.rank.charAt(0).toUpperCase() +
                                  stats.rank.slice(1).toLowerCase()
                                : "Bronze"}
                        </p>
                    </div>
                    <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className={`text-5xl p-3 rounded-xl bg-gradient-to-br ${rankInfo.color}`}
                    >
                        {rankInfo.icon}
                    </motion.div>
                </div>

                {/* Rank section */}
                <div
                    className={`bg-gradient-to-r ${rankInfo.color} rounded-lg px-4 py-2 mb-6`}
                >
                    <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider">
                        {stats.rank} Rank
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <Crown size={16} className="text-yellow-300" />
                        <p className="text-xl font-bold text-white">
                            {points} Points
                        </p>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {/* Wins */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-center cursor-pointer hover:bg-green-900/50 transition"
                    >
                        <div className="flex justify-center mb-2">
                            <TrendingUp size={20} className="text-green-400" />
                        </div>
                        <p className="text-xs font-semibold text-green-300 mb-1">
                            Wins
                        </p>
                        <p className="text-2xl font-black text-green-400">
                            {wins}
                        </p>
                    </motion.div>

                    {/* Losses */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 text-center cursor-pointer hover:bg-red-900/50 transition"
                    >
                        <div className="flex justify-center mb-2">
                            <TrendingDown size={20} className="text-red-400" />
                        </div>
                        <p className="text-xs font-semibold text-red-300 mb-1">
                            Losses
                        </p>
                        <p className="text-2xl font-black text-red-400">
                            {losses}
                        </p>
                    </motion.div>

                    {/* Draws */}
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-center cursor-pointer hover:bg-blue-900/50 transition"
                    >
                        <div className="flex justify-center mb-2">
                            <Target size={20} className="text-blue-400" />
                        </div>
                        <p className="text-xs font-semibold text-blue-300 mb-1">
                            Draws
                        </p>
                        <p className="text-2xl font-black text-blue-400">
                            {draws}
                        </p>
                    </motion.div>
                </div>

                {/* Win rate */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4"
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Zap size={18} className="text-purple-400" />
                            <span className="font-semibold text-purple-300">
                                Win Rate
                            </span>
                        </div>
                        <span className="text-2xl font-black text-purple-400">
                            {winRate}%
                        </span>
                    </div>
                    {/* Win rate bar */}
                    <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${winRate}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                    </div>
                </motion.div>

                {/* Experience */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mt-3"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Crown size={18} className="text-indigo-400" />
                            <span className="font-semibold text-indigo-300">
                                Experience (XP)
                            </span>
                        </div>
                        <span className="text-2xl font-black text-indigo-400">
                            {experience.toLocaleString()} XP
                        </span>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default PlayerStatsCard;
