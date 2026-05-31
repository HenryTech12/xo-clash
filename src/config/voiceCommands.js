export const VOICE_COMMANDS = {
    en: {
        patterns: {
            MOVE: /row\s+(one|two|three|1|2|3)\s+(?:and\s+)?(?:column|col)\s+(one|two|three|1|2|3)/i,
            ACTIVATE: /activate\s+(.+)/i,
            LEAVE: /end the session|leave game|quit game|exit/i,
            PLAY_AGAIN: /play again|rematch|challenge again/i,
        },
        powerUps: {
            "extra move": "EXTRA_MOVE",
            "block cell": "BLOCK_CELL",
            "undo move": "UNDO_MOVE",
            "swap cell": "SWAP_CELL",
            "hint": "HINT",
            "ghost move": "GHOST_MOVE"
        },
        numbers: {
            "one": 0,
            "two": 1,
            "three": 2,
            "1": 0,
            "2": 1,
            "3": 2
        }
    },
    es: {
        patterns: {
            MOVE: /fila\s+(uno|dos|tres|1|2|3)\s+(?:y\s+)?columna\s+(uno|dos|tres|1|2|3)/i,
            ACTIVATE: /activar\s+(.+)/i,
            LEAVE: /terminar sesión|salir del juego|quitar/i,
            PLAY_AGAIN: /jugar de nuevo|revancha/i,
        },
        powerUps: {
            "movimiento extra": "EXTRA_MOVE",
            "bloquear celda": "BLOCK_CELL",
            "deshacer movimiento": "UNDO_MOVE",
            "cambiar celda": "SWAP_CELL",
            "pista": "HINT",
            "movimiento fantasma": "GHOST_MOVE"
        },
        numbers: {
            "uno": 0,
            "dos": 1,
            "tres": 2,
            "1": 0,
            "2": 1,
            "3": 2
        }
    }
};
