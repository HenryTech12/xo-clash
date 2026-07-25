import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Loader2 } from "lucide-react";

const VoiceOverlay = ({
    isVisible,
    isListening,
    isProcessing,
    transcript,
    error,
    onClose,
}) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 md:p-8 pointer-events-none"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 50, filter: 'blur(10px)' }}
                        animate={{ scale: 1, opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ scale: 0.9, opacity: 0, y: 50, filter: 'blur(10px)' }}
                        className={`relative w-full max-w-lg overflow-hidden bg-surface/95 backdrop-blur-xl border-t-2 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto font-rajdhani ${
                            error ? "border-danger shadow-[0_0_30px_rgba(255, 84, 104,0.3)]" : "border-brand shadow-[0_0_30_rgba(91, 110, 245,0.2)]"
                        }`}
                    >
                        {/* Scanlines layer */}
                        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none" />
                        
                        {/* Background Glow */}
                        <div
                            className={`absolute inset-0 opacity-10 bg-linear-to-br transition-colors duration-500 ${
                                error
                                    ? "from-danger to-transparent"
                                    : "from-brand to-master"
                            }`}
                        />

                        <div className="relative p-8 flex flex-row items-center gap-8 text-left">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 z-10 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Status Icon */}
                            <div className="relative shrink-0">
                                <AnimatePresence mode="wait">
                                    {isProcessing ? (
                                        <motion.div
                                            key="processing"
                                            className="relative"
                                        >
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                                className="absolute -inset-2 border-2 border-dashed border-brand rounded-full"
                                            />
                                            <div className="p-5 bg-void rounded-full border border-brand shadow-[0_0_20px_rgba(91, 110, 245,0.4)]">
                                                <Loader2
                                                    size={40}
                                                    className="text-brand animate-spin"
                                                />
                                            </div>
                                        </motion.div>
                                    ) : error ? (
                                        <motion.div
                                            key="error"
                                            className="p-5 bg-danger/20 rounded-full border border-danger shadow-[0_0_20px_rgba(255, 84, 104,0.4)]"
                                        >
                                            <X
                                                size={40}
                                                className="text-danger"
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="listening"
                                            className="relative"
                                        >
                                            {/* Sonar pulses */}
                                            {[1, 2, 3].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ scale: 0.8, opacity: 0.5 }}
                                                    animate={{ scale: 2, opacity: 0 }}
                                                    transition={{
                                                        repeat: Infinity,
                                                        duration: 2,
                                                        delay: i * 0.6,
                                                    }}
                                                    className="absolute inset-0 border border-brand rounded-full"
                                                />
                                            ))}
                                            <div className="relative p-6 bg-void border-2 border-brand rounded-full shadow-[0_0_30px_rgba(91, 110, 245,0.3)]">
                                                <Mic
                                                    size={48}
                                                    className="text-brand"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="grow">
                                <h3 className="text-sm font-black text-slate-500 mb-1 uppercase tracking-[0.4em] font-orbitron">
                                    {isProcessing
                                        ? "AI Processing"
                                        : error
                                        ? "Neural Breach"
                                        : "Voice Link Active"}
                                </h3>
                                <h2 className={`text-2xl font-black mb-3 ${error ? 'text-danger' : 'text-white'}`}>
                                    {isProcessing
                                        ? "Parsing Command..."
                                        : error
                                        ? "Command Rejected"
                                        : "Awaiting Input"}
                                </h2>

                                <div className="min-h-10 flex flex-col justify-center border-l-2 border-brand/20 pl-4 py-1">
                                    {transcript ? (
                                        <motion.p
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-lg text-brand font-bold tracking-wide italic"
                                        >
                                            "{transcript}"
                                        </motion.p>
                                    ) : (
                                        !error && (
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                                                [ Speak move coordinates ]
                                            </p>
                                        )
                                    )}

                                    {error && (
                                        <motion.p
                                            initial={{ x: -10 }}
                                            animate={{
                                                x: [0, -10, 10, -10, 0],
                                            }}
                                            className="text-red-400 font-bold"
                                        >
                                            {error}
                                        </motion.p>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <button
                                    onClick={onClose}
                                    className="shrink-0 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors font-bold text-sm"
                                >
                                    TRY AGAIN
                                </button>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VoiceOverlay;
