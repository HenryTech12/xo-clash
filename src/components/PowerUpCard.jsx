import { motion } from "framer-motion";
import {
    Zap,
} from "lucide-react";
import {
    POWER_UP_CONFIG,
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

    const isUsable = isUnlocked && count > 0;

    const handleClick = () => {
        if (isUsable && onActivate) {
            onActivate(powerupConfig);
        }
    };

    return (
        <motion.div
            whileHover={isUsable ? { scale: 1.02 } : {}}
            className={`relative h-64 rounded-[10px] border transition-colors cursor-pointer font-rajdhani overflow-hidden group ${
                !isUsable ? "opacity-30 grayscale cursor-not-allowed border-white/5" : "border-brand/20 bg-surface/90 hover:border-brand/50"
            } ${isActive ? "border-brand ring-1 ring-brand" : ""}`}
            onClick={handleClick}
        >
            {/* Content */}
            <div className="relative h-full flex flex-col p-5 z-10">
                {/* Header: Icon & Quantity */}
                <div className="flex justify-between items-start mb-6">
                    <div className={`p-3 rounded-md bg-void border border-white/10 ${isUsable ? 'text-brand' : 'text-slate-600'}`}>
                        <IconComponent size={28} />
                    </div>

                    {isUnlocked && (
                        <div className="bg-void px-3 py-1 rounded-md border border-white/5 flex items-center gap-1.5">
                            <span className="text-[8px] font-black font-orbitron text-slate-500 uppercase">Qty</span>
                            <span className="text-sm font-black font-data text-brand">{count}</span>
                        </div>
                    )}
                </div>

                {/* Body: Title & Meta */}
                <div className="mb-4">
                    <h3 className="font-black font-orbitron text-white text-sm tracking-widest uppercase">
                        {powerupConfig.name}
                    </h3>
                </div>

                {/* Description */}
                <p className="text-[11px] font-medium text-slate-400 mb-6 grow leading-relaxed">
                    {powerupConfig.description}
                </p>

                {/* Footer: Requirements or Status */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${isUsable ? 'bg-live animate-pulse' : 'bg-slate-700'}`} />
                         <span className="text-[9px] font-black font-orbitron text-slate-500 uppercase tracking-widest">
                            {isUsable ? 'Ready' : 'Locked'}
                         </span>
                    </div>
                    {powerupConfig.unlockRank && (
                         <span className="text-[9px] font-black font-orbitron text-rank-gold">
                            {powerupConfig.unlockRank.toUpperCase()}
                         </span>
                    )}
                </div>
            </div>

            {/* Action overlay on hover */}
            {isUsable && (
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            )}
        </motion.div>
    );
};

export default PowerUpCard;
