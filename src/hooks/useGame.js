import { useContext } from "react";
import {
    GameContext,
    MatchmakingContext,
    PowerUpContext,
} from "../context/GameContextInstance";

export const useGame = () => {
    const game = useContext(GameContext);
    const matchmaking = useContext(MatchmakingContext);
    const powerUps = useContext(PowerUpContext);

    return {
        ...game,
        ...matchmaking,
        ...powerUps,
    };
};
