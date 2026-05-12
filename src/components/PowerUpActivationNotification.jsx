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
                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -50 }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"
                >
                    <div className="bg-slate-900/90 border-2 border-purple-500 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_50px_rgba(168,85,247,0.4)] flex flex-col items-center gap-4">
                        <motion.div
                            animate={{
                                rotate: [0, 10, -10, 0],
                                scale: [1, 1.2, 1],
                            }}
                            transition={{ duration: 0.5, repeat: 2 }}
                            className="bg-purple-500 p-4 rounded-full shadow-lg"
                        >
                            <Icon size={40} className="text-white" />
                        </motion.div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-white mb-1 uppercase tracking-tighter">
                                {notification.powerUpType.replace("_", " ")}
                            </h3>
                            <p className="text-purple-300 font-bold">
                                ACTIVATED BY {notification.playerName}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PowerUpActivationNotification;
