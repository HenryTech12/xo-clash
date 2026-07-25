import { useGame } from "../hooks/useGame";
import Game from "../pages/Game";
import Dashboard from "../pages/Dashboard";

const ReconnectingScreen = () => (
    <div className="min-h-screen bg-void flex items-center justify-center font-rajdhani">
        <div className="flex items-center gap-3 px-6 py-4 rounded-lg border border-surface-2 bg-surface">
            <span className="h-2.5 w-2.5 rounded-full bg-warn shadow-[0_0_0_4px_rgba(232,166,59,0.2)] animate-pulse" />
            <p className="text-xs font-data uppercase tracking-widest text-warn">
                Reconnecting to Match
            </p>
        </div>
    </div>
);

const GameSwitch = () => {
    const { gameState, reconnecting } = useGame();
    if (reconnecting) return <ReconnectingScreen />;
    return gameState ? <Game /> : <Dashboard />;
};

export default GameSwitch;
