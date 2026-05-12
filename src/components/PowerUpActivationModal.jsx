import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Zap,
    Sword,
    Trophy,
    Clock,
    Sparkles,
    AlertCircle,
} from "lucide-react";
import { POWER_UP_CONFIG, RARITY_COLORS } from "../config/powerUpConfig";

const PowerUpActivationModal = ({
    powerupConfig,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    if (!powerupConfig) return null;

    const IconComponent = powerupConfig.icon || Zap;
    const rarityColor =
        RARITY_COLORS[powerupConfig.rarity] || "from-gray-400 to-gray-600";

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className={`relative max-w-md w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 ${powerupConfig.borderColor} overflow-hidden shadow-2xl`}
                >
                    {/* Animated background */}
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute inset-0 bg-gradient-to-br ${rarityColor} opacity-20`}
                    />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 hover:bg-slate-700/50 rounded-lg transition"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10 p-8">
                        {/* Icon */}
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${rarityColor} flex items-center justify-center shadow-lg`}
                        >
                            <IconComponent size={40} className="text-white" />
                        </motion.div>

                        {/* Power-up name */}
                        <h2 className="text-3xl font-black text-center mb-2 text-white">
                            {powerupConfig.name}
                        </h2>

                        {/* Rarity badge */}
                        <div className="text-center mb-4">
                            <span
                                className={`inline-block px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r ${rarityColor} text-white uppercase tracking-wide`}
                            >
                                {powerupConfig.rarity}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-300 text-center mb-6 text-lg">
                            {powerupConfig.description}
                        </p>

                        {/* Abilities */}
                        <div className="space-y-3 mb-6">
                            <h3 className="text-purple-300 font-bold text-sm uppercase tracking-wider">
                                Abilities & Boosts
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Attack Boost */}
                                {powerupConfig.attackBoost > 0 && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-center"
                                    >
                                        <div className="flex justify-center mb-1">
                                            <Sword
                                                size={20}
                                                className="text-red-400"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-red-300 mb-1">
                                            Attack Boost
                                        </p>
                                        <p className="text-lg font-bold text-red-400">
                                            +{powerupConfig.attackBoost}%
                                        </p>
                                    </motion.div>
                                )}

                                {/* Defense Boost */}
                                {powerupConfig.defenseBoost > 0 && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-center"
                                    >
                                        <div className="flex justify-center mb-1">
                                            <Trophy
                                                size={20}
                                                className="text-blue-400"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-blue-300 mb-1">
                                            Defense Boost
                                        </p>
                                        <p className="text-lg font-bold text-blue-400">
                                            +{powerupConfig.defenseBoost}%
                                        </p>
                                    </motion.div>
                                )}

                                {/* Duration */}
                                {powerupConfig.duration > 0 && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 text-center"
                                    >
                                        <div className="flex justify-center mb-1">
                                            <Zap
                                                size={20}
                                                className="text-yellow-400"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-yellow-300 mb-1">
                                            Active
                                        </p>
                                        <p className="text-lg font-bold text-yellow-400">
                                            {powerupConfig.duration}s
                                        </p>
                                    </motion.div>
                                )}

                                {/* Cooldown */}
                                {powerupConfig.cooldown > 0 && (
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        className="bg-purple-500/20 border border-purple-500/50 rounded-lg p-3 text-center"
                                    >
                                        <div className="flex justify-center mb-1">
                                            <Clock
                                                size={20}
                                                className="text-purple-400"
                                            />
                                        </div>
                                        <p className="text-xs font-bold text-purple-300 mb-1">
                                            Cooldown
                                        </p>
                                        <p className="text-lg font-bold text-purple-400">
                                            {powerupConfig.cooldown}s
                                        </p>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Hidden potential */}
                        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-6 flex gap-2">
                            <AlertCircle
                                size={20}
                                className="text-blue-400 flex-shrink-0"
                            />
                            <p className="text-xs text-blue-300">
                                {powerupConfig.potential}
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-3 rounded-lg bg-gradient-to-r ${rarityColor} hover:opacity-90 text-white font-bold transition disabled:opacity-50 flex items-center justify-center gap-2`}
                            >
                                {isLoading ? (
                                    <>
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1,
                                            }}
                                        >
                                            <Sparkles size={18} />
                                        </motion.div>
                                        Activating...
                                    </>
                                ) : (
                                    <>
                                        <Zap size={18} />
                                        Activate
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PowerUpActivationModal;
