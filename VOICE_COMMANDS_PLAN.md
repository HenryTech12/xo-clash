# Multilingual Voice Command Feature Implementation Plan

## 1. Core Technology: Web Speech API

We will use the native `Web Speech API` (primarily `SpeechRecognition`) which is supported in most modern browsers. This avoids external dependencies and supports multiple languages.

## 2. Architecture: `VoiceCommandManager` Component

I propose creating a dedicated hook or context-aware component that manages the lifecycle of voice recognition.

### A. Lifecycle Management

-   **Activation:** The voice system will only be active when `gameState` exists and a game is in progress.
-   **Auto-Restart:** The API often stops after a period of silence; we will implement a "continuous" mode logic.
-   **Privacy:** A UI indicator (mic icon) will show when the system is listening.

### B. Command Mapping

We will use Regex patterns to match recognized text to game actions.

| Action          | Intent / Command Pattern                 | Parameters  |
| :-------------- | :--------------------------------------- | :---------- |
| **Move**        | "make my move on row {X} and col {Y}"    | row, col    |
| **Power-up**    | "activate {PowerUpName}"                 | powerUpType |
| **End Session** | "end the session", "leave game"          | -           |
| **Challenge**   | "send a challenge request", "play again" | -           |

## 3. Multilingual Strategy

The system will detect or allow setting a language code (e.g., `en-US`, `es-ES`, `fr-FR`).

-   **Translation Map:** A configuration file will map language-specific phrases to standardized "Intent IDs".
-   **Example (Spanish):** "haz mi movimiento en fila 1 columna 3" → `MOVE_ACTION(0, 2)`.

## 4. Proposed File Structure

-   `src/hooks/useVoiceCommands.js`: The "brain" that listens and dispatches actions to `useGame`.
-   `src/config/voiceCommands.js`: Dictionary of patterns and matching logic for different languages.
-   `src/components/VoiceStatus.jsx`: Visual feedback for the player (listening/processing/error).

## 5. Implementation Steps

1. **Define Patterns:** Create a robust dictionary of phrases for the requested actions.
2. **Hook Logic:** Create `useVoiceCommands` that hooks into `useGame` to calling `makeMove`, `usePowerUp`, and `requestPlayAgainGame`.
3. **Integration:** Add the hook to `Game.jsx` so it initializes only when the game starts.
4. **UI Feedback:** Show a "Listening..." indicator in the game UI.
5. **Robustness:** Handle "Permission Denied" and "No Match" errors gracefully with toasts.

### Request Flow:

1. User says: _"Make move row 1 column 3"_
2. `SpeechRecognition` → Text: "make move row one column three"
3. `VoiceCommandManager` → Matches `MOVE_PATTERN` → row=0, col=2.
4. `useGame.makeMove(0, 2)` is called.
5. Game UI updates normally.

Does this strategy sound good to you? Once you confirm, I can start defining the command patterns.
