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
                className="fixed inset-0 bg-arena-dark/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 font-rajdhani"
            >
                <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
                
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, rotateX: 20 }}
                    animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-lg w-full bg-arena-mid/95 border border-plasma-blue/30 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,212,255,0.2)]"
                    style={{ perspective: 1000 }}
                >
                    {/* Header: Identity */}
                    <div className="bg-arena-dark p-8 text-center relative border-b border-plasma-blue/10">
                        <div className="absolute top-0 left-0 w-full h-1 bg-plasma-blue" />
                        <p className="text-[10px] font-black font-orbitron text-plasma-blue/60 uppercase tracking-[0.5em] mb-4">
                            Module Activation Sequence
                        </p>
                        
                        <div className="relative inline-block mb-6">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                className="absolute -inset-4 border border-dashed border-plasma-blue/30 rounded-full"
                            />
                            <div className="p-6 bg-arena-surface rounded-full border border-plasma-blue/50 shadow-[0_0_30px_rgba(0,212,255,0.3)]">
                                <IconComponent size={48} className="text-plasma-blue" />
                            </div>
                        </div>

                        <h2 className="text-4xl font-black font-orbitron text-white tracking-widest mb-2 uppercase">
                            {powerupConfig.name}
                        </h2>
                        <div className="flex justify-center">
                            <span className="px-3 py-1 bg-plasma-blue/10 border border-plasma-blue/30 rounded-lg text-[10px] font-black font-orbitron text-plasma-blue tracking-[0.2em] uppercase">
                                Grade: {powerupConfig.rarity || 'Prime'}
                            </span>
                        </div>
                    </div>

                    <div className="p-10">
                        <p className="text-lg text-slate-300 text-center mb-10 leading-relaxed italic">
                            "{powerupConfig.description}"
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                             <div className="p-4 bg-arena-dark/40 border border-white/5 rounded-2xl text-center">
                                <p className="text-[9px] font-black font-orbitron text-slate-500 uppercase mb-1">Impact Radius</p>
                                <p className="text-xl font-black font-orbitron text-white">Precise</p>
                             </div>
                             <div className="p-4 bg-arena-dark/40 border border-white/5 rounded-2xl text-center">
                                <p className="text-[9px] font-black font-orbitron text-slate-500 uppercase mb-1">Energy Cost</p>
                                <p className="text-xl font-black font-orbitron text-plasma-blue">1 Unit</p>
                             </div>
                        </div>

                        <div className="flex flex-col gap-4 relative z-10">
                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(0,212,255,0.4)" }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="w-full py-5 bg-plasma-blue text-arena-dark rounded-2xl font-black font-orbitron text-sm tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-3"
                            >
                                {isLoading ? "INITIATING..." : (
                                    <>ENGAGE MODULE <Zap size={18} fill="currentColor" /></>
                                )}
                            </motion.button>
                            
                            <button
                                onClick={onClose}
                                className="w-full py-4 text-slate-500 hover:text-white transition-colors text-[10px] font-black font-orbitron tracking-widest uppercase"
                            >
                                Abort Sequence
                            </button>
                        </div>
                    </div>

                    {/* Decorations */}
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-linear-to-r from-transparent via-plasma-blue/20 to-transparent" />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PowerUpActivationModal;
