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
        <div className="fixed left-8 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col gap-6 font-rajdhani">
            <div className="text-[9px] font-black text-brand/40 uppercase tracking-[0.5em] vertical-text mb-4 font-orbitron">
                Tactical Status
            </div>
            {activePowerUps.map((pu, idx) => {
                const Icon = POWERUP_ICONS[pu.type] || Zap;
                return (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -30, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -30 }}
                        whileHover={{ scale: 1.1, x: 5 }}
                        className="group relative"
                    >
                        <div className="p-4 bg-surface/90 border border-brand/30 rounded-xl backdrop-blur-xl shadow-[0_0_15px_rgba(91, 110, 245,0.15)] relative overflow-hidden">
                            <div className="absolute inset-0 scanlines opacity-20" />
                            <Icon size={22} className="text-brand relative z-10" />
                            
                            {/* Pulse underlying */}
                            <motion.div 
                                animate={{ opacity: [0.1, 0.3, 0.1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-brand/10"
                            />
                        </div>

                        {/* Tooltip Link */}
                        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-surface-2 border border-brand/30 text-white rounded-lg shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 pointer-events-none z-50">
                            <p className="text-[10px] font-black font-orbitron uppercase text-brand tracking-widest mb-1 truncate max-w-30">
                                {pu.type.replace("_", " ")}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: "100%" }}
                                        animate={{ width: "0%" }}
                                        transition={{ duration: pu.duration * 3 }} // Visual estimate
                                        className="h-full bg-brand shadow-[0_0_8px_#5b6ef5]"
                                     />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">{pu.duration}T</span>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ActivePowerUpsPanel;
