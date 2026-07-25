import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

const PowerUpActivationModal = ({
    powerupConfig,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    if (!powerupConfig) return null;

    const IconComponent = powerupConfig.icon || Zap;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-void/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 font-rajdhani"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ type: "spring", damping: 25 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative max-w-lg w-full bg-surface/95 border border-brand/30 rounded-[10px] overflow-hidden"
                >
                    {/* Header: Identity */}
                    <div className="bg-void p-8 text-center relative border-b border-brand/10">
                        <div className="inline-block mb-6 p-6 bg-surface-2 rounded-full border border-brand/50">
                            <IconComponent size={48} className="text-brand" />
                        </div>

                        <h2 className="text-4xl font-black font-orbitron text-white tracking-widest mb-2 uppercase">
                            {powerupConfig.name}
                        </h2>
                        {powerupConfig.rarity && (
                            <div className="flex justify-center">
                                <span className="px-3 py-1 bg-brand/10 border border-brand/30 rounded-md text-[10px] font-black font-orbitron text-brand tracking-[0.2em] uppercase">
                                    {powerupConfig.rarity}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="p-10">
                        <p className="text-lg text-slate-300 text-center mb-10 leading-relaxed">
                            {powerupConfig.description}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mb-10">
                             <div className="p-4 bg-void/40 border border-white/5 rounded-md text-center">
                                <p className="text-[9px] font-black font-orbitron text-slate-500 uppercase mb-1">Duration</p>
                                <p className="text-xl font-black font-data text-white">{powerupConfig.duration || 1}T</p>
                             </div>
                             <div className="p-4 bg-void/40 border border-white/5 rounded-md text-center">
                                <p className="text-[9px] font-black font-orbitron text-slate-500 uppercase mb-1">Unlock Rank</p>
                                <p className="text-xl font-black font-orbitron text-rank-gold">{powerupConfig.unlockRank || "Bronze"}</p>
                             </div>
                        </div>

                        <div className="flex flex-col gap-3 relative z-10">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                disabled={isLoading}
                                className="w-full py-4 bg-brand hover:bg-[#6d7ef7] text-white rounded-md font-black font-orbitron text-sm tracking-[0.3em] uppercase transition-colors flex items-center justify-center gap-3"
                            >
                                {isLoading ? "Activating..." : (
                                    <>Activate <Zap size={18} fill="currentColor" /></>
                                )}
                            </motion.button>

                            <button
                                onClick={onClose}
                                className="w-full py-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black font-orbitron tracking-widest uppercase"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PowerUpActivationModal;
