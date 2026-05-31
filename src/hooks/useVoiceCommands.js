import { useMemo, useCallback } from "react";
import { useVoiceInput } from "./useVoiceInput";
import { VOICE_COMMANDS } from "../config/voiceCommands";
import { toast } from "react-hot-toast";

/**
 * Enhanced hook for managing game-specific voice commands.
 * It parses recognized text into actionable game intents.
 */
export const useVoiceCommands = ({
    language = "en",
    makeMove,
    activatePowerUp,
    leaveSession,
    requestPlayAgainGame
}) => {
    const config = useMemo(() => VOICE_COMMANDS[language] || VOICE_COMMANDS.en, [language]);

    const handleVoiceCommand = useCallback((text) => {
        console.log("Analyzing voice command:", text);

        // 1. Check for Move
        const moveMatch = text.match(config.patterns.MOVE);
        if (moveMatch) {
            const rowStr = moveMatch[1].toLowerCase();
            const colStr = moveMatch[2].toLowerCase();
            const row = config.numbers[rowStr];
            const col = config.numbers[colStr];

            if (row !== undefined && col !== undefined) {
                console.log(`Executing voice move: [${row}, ${col}]`);
                makeMove(row, col);
                return;
            }
        }

        // 2. Check for Power-up Activation
        const activateMatch = text.match(config.patterns.ACTIVATE);
        if (activateMatch) {
            const powerUpName = activateMatch[1].trim().toLowerCase();
            // Try to find the power-up ID by name mapping
            const powerUpId = config.powerUps[powerUpName];
            
            if (powerUpId) {
                console.log(`Activating power-up via voice: ${powerUpId}`);
                activatePowerUp(powerUpId);
                return;
            } else {
                toast.error(`Unknown power-up: "${powerUpName}"`);
                return;
            }
        }

        // 3. Check for Leave
        if (config.patterns.LEAVE.test(text)) {
            console.log("Leaving session via voice");
            leaveSession();
            return;
        }

        // 4. Check for Play Again
        if (config.patterns.PLAY_AGAIN.test(text)) {
            console.log("Requesting play again via voice");
            requestPlayAgainGame();
            return;
        }

        toast.error(`Command not recognized: "${text}"`, {
            id: "voice-error",
        });
        console.warn("Voice command recognized but no mapping found:", text);
    }, [config, makeMove, activatePowerUp, leaveSession, requestPlayAgainGame]);

    const apiLang = useMemo(() => {
        const map = {
            en: "en-US",
            es: "es-ES",
        };
        return map[language] || "en-US";
    }, [language]);

    const voiceInput = useVoiceInput(handleVoiceCommand, apiLang);

    return {
        ...voiceInput,
        currentLanguage: language,
    };
};
