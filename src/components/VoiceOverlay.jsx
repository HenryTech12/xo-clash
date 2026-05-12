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
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className={`relative w-full max-w-md overflow-hidden bg-slate-900 border-2 rounded-3xl shadow-2xl ${
                            error ? "border-red-500/50" : "border-blue-500/50"
                        }`}
                    >
                        {/* Background Glow */}
                        <div
                            className={`absolute inset-0 opacity-20 bg-gradient-to-br transition-colors duration-500 ${
                                error
                                    ? "from-red-600 to-transparent"
                                    : "from-blue-600 to-purple-600"
                            }`}
                        />

                        <div className="relative p-8 flex flex-col items-center text-center">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Status Icon */}
                            <div className="relative mb-6">
                                <AnimatePresence mode="wait">
                                    {isProcessing ? (
                                        <motion.div
                                            key="processing"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1, rotate: 360 }}
                                            exit={{ scale: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                repeat: Infinity,
                                                ease: "linear",
                                            }}
                                            className="p-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                                        >
                                            <Loader2
                                                size={40}
                                                className="text-white"
                                            />
                                        </motion.div>
                                    ) : error ? (
                                        <motion.div
                                            key="error"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="p-4 bg-red-500 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                                        >
                                            <X
                                                size={40}
                                                className="text-white"
                                            />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="listening"
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                boxShadow: [
                                                    "0 0 0px rgba(59,130,246,0)",
                                                    "0 0 30px rgba(59,130,246,0.5)",
                                                    "0 0 0px rgba(59,130,246,0)",
                                                ],
                                            }}
                                            transition={{
                                                repeat: Infinity,
                                                duration: 1.5,
                                            }}
                                            className="p-6 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full"
                                        >
                                            <Mic
                                                size={48}
                                                className="text-white"
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Waveform Animation (Only when listening) */}
                                {isListening && !isProcessing && (
                                    <div className="absolute -inset-4 flex items-center justify-center gap-1">
                                        {[1, 2, 3, 4, 5].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{
                                                    height: [10, 40, 10],
                                                }}
                                                transition={{
                                                    repeat: Infinity,
                                                    duration: 0.5,
                                                    delay: i * 0.1,
                                                }}
                                                className="w-1 bg-blue-400/50 rounded-full"
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">
                                {isProcessing
                                    ? "Analyzing Command"
                                    : error
                                    ? "Error Occurred"
                                    : "Listening..."}
                            </h3>

                            <div className="min-h-[4rem] flex flex-col justify-center">
                                {transcript ? (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-lg text-blue-200 italic font-medium"
                                    >
                                        "{transcript}"
                                    </motion.p>
                                ) : (
                                    !error && (
                                        <p className="text-slate-400 text-sm">
                                            Try saying "Row 1 Column 2" or "Top
                                            Left"
                                        </p>
                                    )
                                )}

                                {error && (
                                    <motion.p
                                        initial={{ x: -10 }}
                                        animate={{ x: [0, -10, 10, -10, 0] }}
                                        className="text-red-400 font-bold"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </div>

                            {error && (
                                <button
                                    onClick={onClose}
                                    className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-colors font-bold text-sm"
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
