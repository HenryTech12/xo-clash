import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const PowerUpActivationNotification = ({ notification, onClear }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (notification) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onClear, 500); // Wait for exit animation
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, onClear]);

    if (!notification) return null;

    const Icon = POWERUP_ICONS[notification.powerUpType] || Zap;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 1.2, filter: 'blur(20px)' }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none font-rajdhani"
                >
                    <div className="bg-arena-mid/95 border border-plasma-blue/30 rounded-[2rem] p-10 backdrop-blur-2xl shadow-[0_0_80px_rgba(0,212,255,0.3)] flex flex-col items-center gap-6 min-w-[300px]">
                        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none rounded-[2rem]" />
                        
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                boxShadow: ["0 0 20px rgba(0,212,255,0)", "0 0 40px rgba(0,212,255,0.4)", "0 0 20px rgba(0,212,255,0)"]
                            }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="bg-arena-dark p-5 rounded-2xl border border-plasma-blue shadow-lg relative z-10"
                        >
                            <Icon size={44} className="text-plasma-blue" />
                        </motion.div>
                        
                        <div className="text-center relative z-10">
                            <p className="text-[10px] font-black font-orbitron text-plasma-blue/60 uppercase tracking-[0.5em] mb-2">Tactical Alert</p>
                            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest font-orbitron italic">
                                {notification.powerUpType.replace("_", " ")}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <span className="h-[1px] w-4 bg-plasma-purple/50" />
                                <p className="text-plasma-purple font-black text-xs uppercase tracking-widest font-orbitron">
                                    USER: {notification.playerName?.toUpperCase()}
                                </p>
                                <span className="h-[1px] w-4 bg-plasma-purple/50" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PowerUpActivationNotification;
