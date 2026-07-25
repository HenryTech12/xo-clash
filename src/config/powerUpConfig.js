// Power-up configuration mapping actual backend power-ups
import { Zap, Lock, RotateCcw, ArrowLeftRight, Lightbulb, Ghost } from "lucide-react";

export const POWER_UP_CONFIG = {
    EXTRA_MOVE: {
        id: "EXTRA_MOVE",
        name: "Extra Move",
        description: "Get one additional move in the current round",
        icon: Zap,
        type: "OFFENSIVE",
        rarity: "common",
        attackBoost: 0,
        defenseBoost: 20,
        duration: 1,
        cooldown: 2,
        potential: "Gain an extra turn to make a strategic play",
        unlockRank: "Gold",
        color: "from-blue-400 to-blue-600",
        borderColor: "border-blue-500",
    },
    BLOCK_CELL: {
        id: "BLOCK_CELL",
        name: "Block Cell",
        description: "Block a cell to prevent opponent from placing",
        icon: Lock,
        type: "DEFENSIVE",
        rarity: "uncommon",
        attackBoost: 0,
        defenseBoost: 50,
        duration: 2,
        cooldown: 3,
        potential: "Lock down critical cells and control the board",
        unlockRank: "Platinum",
        color: "from-green-400 to-green-600",
        borderColor: "border-green-500",
    },
    UNDO_MOVE: {
        id: "UNDO_MOVE",
        name: "Undo Move",
        description: "Revert your last move and try again",
        icon: RotateCcw,
        type: "UTILITY",
        rarity: "rare",
        attackBoost: 10,
        defenseBoost: 40,
        duration: 1,
        cooldown: 1,
        potential: "Second chance tactics - perfect for recovery",
        unlockRank: "Diamond",
        color: "from-purple-400 to-purple-600",
        borderColor: "border-purple-500",
    },
    SWAP_CELL: {
        id: "SWAP_CELL",
        name: "Swap Cell",
        description: "Exchange contents of any two cells on the board",
        icon: ArrowLeftRight,
        type: "TACTICAL",
        rarity: "epic",
        attackBoost: 60,
        defenseBoost: 30,
        duration: 1,
        cooldown: 4,
        potential: "Rearrange the board in your favor with precision",
        unlockRank: "Master",
        color: "from-orange-400 to-orange-600",
        borderColor: "border-orange-500",
    },
    HINT: {
        id: "HINT",
        name: "Hint",
        description: "Get an AI suggestion for your best move",
        icon: Lightbulb,
        type: "SUPPORT",
        rarity: "common",
        attackBoost: 0,
        defenseBoost: 0,
        duration: 0,
        cooldown: 0,
        potential: "Strategic guidance when you need it most",
        unlockRank: "Bronze",
        color: "from-yellow-400 to-yellow-600",
        borderColor: "border-yellow-500",
    },
    GHOST_MOVE: {
        id: "GHOST_MOVE",
        name: "Ghost Move",
        description: "Make a move that appears but doesn't count",
        icon: Ghost,
        type: "DECEPTIVE",
        rarity: "legendary",
        attackBoost: 100,
        defenseBoost: 0,
        duration: 1,
        cooldown: 5,
        potential: "Confuse your opponent with phantom placements",
        unlockRank: "Grandmaster",
        color: "from-pink-400 to-pink-600",
        borderColor: "border-pink-500",
    },
};

// Rank-point thresholds, shared between power-up unlock checks (Game.jsx)
// and any UI that shows progress toward the next rank (PlayerStatsCard).
export const RANK_THRESHOLDS = {
    Bronze: 0,
    Silver: 200,
    Gold: 380,
    Platinum: 450,
    Diamond: 600,
    Master: 800,
    Grandmaster: 1000,
};

export const RARITY_COLORS = {
    common: "from-gray-400 to-gray-600",
    uncommon: "from-green-400 to-green-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-orange-400 to-orange-600",
    legendary: "from-pink-400 to-pink-600",
};

export const RARITY_BORDERS = {
    common: "border-gray-500",
    uncommon: "border-green-500",
    rare: "border-blue-500",
    epic: "border-orange-500",
    legendary: "border-pink-500",
};

export const getPowerUpConfig = (powerUpType) => {
    return POWER_UP_CONFIG[powerUpType] || null;
};

export const formatPowerUpName = (powerUpType) => {
    return getPowerUpConfig(powerUpType)?.name || powerUpType;
};

export default POWER_UP_CONFIG;
