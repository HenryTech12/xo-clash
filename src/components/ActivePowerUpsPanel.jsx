import React from "react";
import { motion } from "framer-motion";
import {
    Zap,
    Shield,
    RotateCcw,
    ArrowLeftRight,
    Lightbulb,
    Ghost,
} from "lucide-react";

const POWERUP_ICONS = {
    EXTRA_MOVE: Zap,
    BLOCK_CELL: Shield,
    UNDO_MOVE: RotateCcw,
    SWAP_CELL: ArrowLeftRight,
    HINT: Lightbulb,
    GHOST_MOVE: Ghost,
};

const ActivePowerUpsPanel = ({ activePowerUps }) => {
    if (!activePowerUps || activePowerUps.length === 0) return null;

    return (
        <div className="fixed left-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-4">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest vertical-text mb-2">
                Active Effects
            </div>
            {activePowerUps.map((pu, idx) => {
                const Icon = POWERUP_ICONS[pu.type] || Zap;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="group relative"
                    >
                        <div className="p-3 bg-slate-900/80 border border-purple-500/50 rounded-xl backdrop-blur-md shadow-lg shadow-purple-500/20">
                            <Icon size={20} className="text-purple-400" />
                        </div>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-700">
                            {pu.type.replace("_", " ")} ({pu.duration} turns
                            left)
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ActivePowerUpsPanel;
