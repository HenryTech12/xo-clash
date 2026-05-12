import React from "react";
import { motion } from "framer-motion";
import {
    Sword,
    Zap,
    Clock,
    Sparkles,
    Trophy,
} from "lucide-react";
import {
    POWER_UP_CONFIG,
    RARITY_COLORS,
    RARITY_BORDERS,
} from "../config/powerUpConfig";

const PowerUpCard = ({
    powerupType,
    isUnlocked = false,
    onActivate,
    isActive = false,
    count = 0,
}) => {
    const powerupConfig = POWER_UP_CONFIG[powerupType];
    
    if (!powerupConfig) return null;

    const IconComponent = powerupConfig.icon || Zap;
    const rarityColor = RARITY_COLORS[powerupConfig.rarity] || RARITY_COLORS.common;
    const rarityBorder = RARITY_BORDERS[powerupConfig.rarity] || RARITY_BORDERS.common;

    const isUsable = isUnlocked && count > 0;

    const handleClick = () => {
        if (isUsable && onActivate) {
            onActivate(powerupConfig);
        }
    };

    return (
        <motion.div
            whileHover={isUsable ? { scale: 1.05 } : {}}
            className={`relative h-64 rounded-lg border-2 ${rarityBorder} overflow-hidden cursor-pointer transition-all ${
                !isUsable && "opacity-50 cursor-not-allowed"
            } ${isActive && "ring-4 ring-yellow-400"}`}
            onClick={handleClick}
        >
            {/* Background Gradient */}
            <div
                className={`absolute inset-0 bg-gradient-to-b ${rarityColor} opacity-20`}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-slate-900/80" />

            {/* Content */}
            <div className="relative h-full flex flex-col p-4">
                {/* Icon area */}
                <div className="flex justify-center mb-2">
                    <motion.div
                        animate={isActive ? { rotate: 360 } : {}}
                        transition={{
                            repeat: isActive ? Infinity : 0,
                            duration: 2,
                        }}
                        className={`p-3 rounded-full bg-gradient-to-br ${rarityColor}`}
                    >
                        <IconComponent size={32} className="text-white" />
                    </motion.div>
                </div>

                {/* Name */}
                <h3 className="text-center font-bold text-white text-sm mb-1 truncate">
                    {powerupConfig.name}
                </h3>

                {/* Rarity badge */}
                <div className="text-center mb-2">
                    <span
                        className={`inline-block px-2 py-1 text-xs font-bold rounded bg-gradient-to-r ${rarityColor} text-white uppercase`}
                    >
                        {powerupConfig.rarity}
                    </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 text-center mb-2 flex-grow line-clamp-2">
                    {powerupConfig.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-1 mb-2 text-xs">
                    {powerupConfig.attackBoost > 0 && (
                        <div className="flex items-center gap-1 bg-red-500/20 px-2 py-1 rounded">
                            <Sword size={12} className="text-red-400" />
                            <span className="text-red-300">
                                +{powerupConfig.attackBoost}%
                            </span>
                        </div>
                    )}
                    {powerupConfig.defenseBoost > 0 && (
                        <div className="flex items-center gap-1 bg-blue-500/20 px-2 py-1 rounded">
                            <Trophy size={12} className="text-blue-400" />
                            <span className="text-blue-300">
                                +{powerupConfig.defenseBoost}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Duration & Cooldown */}
                <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-700 pt-2">
                    {powerupConfig.duration > 0 && (
                        <div className="flex items-center gap-1">
                            <Zap size={12} className="text-yellow-400" />
                            <span className="text-slate-300">
                                {powerupConfig.duration}s active
                            </span>
                        </div>
                    )}
                    {powerupConfig.cooldown > 0 && (
                        <div className="flex items-center gap-1">
                            <Clock size={12} className="text-purple-400" />
                            <span className="text-slate-300">
                                {powerupConfig.cooldown}s CD
                            </span>
                        </div>
                    )}
                </div>

                {/* Unlock/Active status & Count */}
                {isUnlocked && (
                    <div className="absolute top-2 left-2 bg-slate-800/80 px-2 py-0.5 rounded text-xs font-bold text-white border border-slate-600">
                        x{count}
                    </div>
                )}
                
                <div className="absolute top-2 right-2">
                    {!isUnlocked ? (
                        <div className="bg-slate-700 rounded-full p-1 group-hover:bg-slate-600 transition-colors" title="Not Unlocked">
                            <Trophy size={16} className="text-gray-400" />
                        </div>
                    ) : count <= 0 ? (
                        <div className="bg-red-500/80 rounded-full p-1" title="Out of Uses">
                            <Clock size={16} className="text-white" />
                        </div>
                    ) : isActive ? (
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="bg-yellow-500 rounded-full p-1"
                            title="Active"
                        >
                            <Sparkles size={16} className="text-white" />
                        </motion.div>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
};

export default PowerUpCard;
