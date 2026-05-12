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
            const data = await powerUpService.getRankings(50);
            const rankingsData = data.rankings || data || []; // Handle both {rankings: []} and [] formats

            // Sort by rankPoints in descending order
            const sortedRankings = [...rankingsData].sort((a, b) => {
                const aPoints = a.rankPoints ?? a.points ?? 0;
                const bPoints = b.rankPoints ?? b.points ?? 0;
                return bPoints - aPoints;
            });

            setRankings(sortedRankings);

            // Find current player's rank
            const currentPlayerRank = sortedRankings.find(
                (r) => (r.username || r.playerId || r.id) === username
            );
            setPlayerRank(currentPlayerRank);
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Trophy size={32} className="text-white" />
                        <h2 className="text-3xl font-black text-white">
                            Global Rankings
                        </h2>
                    </div>
                    <motion.button
                        whileHover={{ rotate: 180 }}
                        onClick={fetchRankings}
                        disabled={loading}
                        className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshCw size={20} className="text-white" />
                    </motion.button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50"
                    />
                    <input
                        type="text"
                        placeholder="Search player..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                </div>
            </div>

            {/* Current Player Info */}
            {playerRank && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-900/30 border-b border-blue-500/30 px-6 py-4 flex items-center gap-4"
                >
                    <Flame size={24} className="text-orange-400" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-300 uppercase">
                            Your Position
                        </p>
                        <p className="text-xl font-black text-white">
                            #{playerRank.rank} {playerRank.username}
                        </p>
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-right"
                    >
                        <p className="text-2xl font-black text-orange-400">
                            {playerRank.rankPoints}
                        </p>
                        <p className="text-xs text-blue-300">Points</p>
                    </motion.div>
                </motion.div>
            )}

            {/* Rankings List */}
            <div className="overflow-y-auto max-h-96">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                repeat: Infinity,
                                duration: 1,
                            }}
                            className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full"
                        />
                    </div>
                ) : filteredRankings.length > 0 ? (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="divide-y divide-slate-700"
                    >
                        {filteredRankings.map((rankObj, index) => {
                            const position = index + 1;
                            const isTop3 = position <= 3;
                            const currUsername =
                                rankObj.username ||
                                rankObj.playerId ||
                                rankObj.id ||
                                "Unknown";
                            const isCurrentPlayer = currUsername === username; // We compare to the 'username' prop
                            const wins =
                                rankObj.wins ??
                                rankObj.totalWins ??
                                rankObj.numOfWins ??
                                0;
                            const losses =
                                rankObj.losses ??
                                rankObj.totalLosses ??
                                rankObj.numOfLosses ??
                                0;
                            const draws =
                                rankObj.draws ??
                                rankObj.totalDraws ??
                                rankObj.numOfDraws ??
                                0;
                            const rankPoints =
                                rankObj.rankPoints ?? rankObj.points ?? 0;
                            const tier = rankObj.rank || "Unranked";
                            const totalGames = wins + losses + draws;
                            const winRate =
                                totalGames > 0
                                    ? ((wins / totalGames) * 100).toFixed(1) +
                                      "%"
                                    : "0.0%";

                            const rankColor =
                                RANK_COLORS[position] ||
                                "from-blue-400 to-blue-600";

                            return (
                                <motion.div
                                    key={currUsername + "-" + index}
                                    variants={itemVariants}
                                    whileHover={{ x: 10 }}
                                    className={`px-6 py-4 flex items-center gap-4${
                                        isCurrentPlayer
                                            ? " bg-blue-900/30"
                                            : isTop3
                                            ? " bg-slate-800/50"
                                            : " hover:bg-slate-800/30 transition"
                                    }`}
                                >
                                    {/* Rank badge */}
                                    {isTop3 ? (
                                        <motion.div
                                            animate={{
                                                rotate: [0, 10, -10, 0],
                                            }}
                                            transition={{
                                                duration: 3,
                                                repeat: Infinity,
                                            }}
                                            className={`text-2xl w-12 flex justify-center font-black`}
                                        >
                                            {RANK_ICONS[position]}
                                        </motion.div>
                                    ) : (
                                        <div className="text-lg font-black text-slate-400 w-12 text-center">
                                            #{position}
                                        </div>
                                    )}

                                    {/* Player info */}
                                    <div className="flex-1 min-w-[120px]">
                                        <p className="font-bold text-white text-lg">
                                            {currUsername}
                                        </p>
                                        <p className="text-xs flex items-center gap-1 mt-1 text-slate-400 capitalize">
                                            Tier:{" "}
                                            {typeof tier === "string"
                                                ? tier.toLowerCase()
                                                : String(tier)}
                                        </p>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="flex space-x-6 items-center flex-1 justify-center">
                                        <div className="text-center">
                                            <p className="font-bold text-green-400">
                                                {wins}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Wins
                                            </p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-red-400">
                                                {losses}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Losses
                                            </p>
                                        </div>
                                        <div className="text-center w-16">
                                            <p className="font-bold text-blue-300">
                                                {winRate}
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Win Rate
                                            </p>
                                        </div>
                                    </div>

                                    {/* Rank points */}
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        className={`px-4 py-2 bg-gradient-to-r ${rankColor} rounded-lg text-right ml-4 min-w-[80px]`}
                                    >
                                        <p className="font-black text-white text-sm">
                                            {rankPoints}
                                        </p>
                                        <p className="text-xs text-white/80">
                                            Points
                                        </p>
                                    </motion.div>

                                    {/* Current player indicator */}
                                    {isCurrentPlayer && (
                                        <motion.div
                                            animate={{ scale: [1, 1.2, 1] }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1,
                                            }}
                                            className="ml-2"
                                        >
                                            <Crown
                                                size={20}
                                                className="text-yellow-400"
                                            />
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        No players found
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default Leaderboard;
