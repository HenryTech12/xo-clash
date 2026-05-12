import { useGame } from "../hooks/useGame";
import Game from "../pages/Game";
import Dashboard from "../pages/Dashboard";

const GameSwitch = () => {
    const { gameState } = useGame();
    return gameState ? <Game /> : <Dashboard />;
};

export default GameSwitch;
