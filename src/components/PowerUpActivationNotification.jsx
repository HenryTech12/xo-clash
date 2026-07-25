import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { POWER_UP_CONFIG } from "../config/powerUpConfig";

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

    const config = POWER_UP_CONFIG[notification.powerUpType];
    const Icon = config?.icon || Zap;

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none font-rajdhani"
                >
                    <div className="bg-surface/95 border border-brand/30 rounded-[10px] p-10 backdrop-blur-2xl flex flex-col items-center gap-6 min-w-[300px]">
                        <div className="bg-void p-5 rounded-md border border-brand relative z-10">
                            <Icon size={44} className="text-brand" />
                        </div>

                        <div className="text-center relative z-10">
                            <p className="text-[10px] font-black font-orbitron text-brand/60 uppercase tracking-[0.5em] mb-2">Power-Up Activated</p>
                            <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-widest font-orbitron">
                                {config?.name || notification.powerUpType.replace("_", " ")}
                            </h3>
                            <p className="text-master font-black text-xs uppercase tracking-widest font-orbitron">
                                {notification.playerName}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PowerUpActivationNotification;
